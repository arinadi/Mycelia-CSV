# Module 3: DuckDB Loader

**Estimated Complexity:** L  
**Estimated Files:** ~4  
**Key Risks:** DuckDB-WASM init is async and large (~6MB); must handle init failure gracefully; CSV ingestion for huge files must not OOM

## Requirements
- Initialize DuckDB-WASM lazily (only after CSV is confirmed, not on page load)
- Show init progress: "Loading query engine... (6MB)"
- Register the CSV File object into DuckDB as table named `data`
- Use DuckDB's native CSV reader (not load all into memory first)
- Expose a `query(sql: string)` function to the store
- Handle DuckDB init failure with actionable error

## Technical Implementation

**DuckDB init pattern:**
```ts
import * as duckdb from '@duckdb/duckdb-wasm'

const DUCKDB_BUNDLES = duckdb.getJsDelivrBundles()

async function initDuckDB(file: File): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES)
  const worker = new Worker(bundle.mainWorker!)
  const logger = new duckdb.ConsoleLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker)

  // Register file — DuckDB reads it lazily
  await db.registerFileHandle('data.csv', file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true)

  // Create view (not table — avoids loading all rows into memory)
  const conn = await db.connect()
  await conn.query(`CREATE VIEW data AS SELECT * FROM read_csv_auto('data.csv')`)
  await conn.close()

  return db
}
```

**Zustand slice:**
```ts
interface DuckDBSlice {
  db: AsyncDuckDB | null
  dbStatus: 'idle' | 'loading' | 'ready' | 'error'
  initDB: (file: File) => Promise<void>
  query: (sql: string) => Promise<QueryResult>
}
```

## Testing
✅ DuckDB loads successfully and `dbStatus` becomes `'ready'`  
✅ `SELECT COUNT(*) FROM data` returns correct row count matching Module 2's totalRows  
✅ `SELECT * FROM data LIMIT 5` returns correct first 5 rows  
✅ Init failure (simulated by removing WASM files) shows error state, not crash  
✅ DuckDB does NOT load on initial page load — only after schema confirm  

---

# Module 4: AI Query Generator

**Estimated Complexity:** M  
**Estimated Files:** ~5  
**Key Risks:** AI may generate invalid SQL; must handle both providers with unified interface; prompt leaking user data beyond schema+sample

## Requirements
- Unified AI adapter interface for Anthropic and OpenAI
- Build prompt: system context + schema + 20 sample rows + user natural language prompt
- Parse AI response to extract clean SQL
- On DuckDB execution error: re-prompt with error message (max 2 auto-retries)
- Show AI "thinking" state with streaming response if possible

## Technical Implementation

**System prompt template:**
```
You are a SQL expert. The user has a CSV file loaded into DuckDB as a table called `data`.

Table schema:
{columns: [{name, type}]}

Sample rows (first 20):
{JSON of 20 rows}

Rules:
- Write ONLY a single DuckDB-compatible SQL SELECT query
- Do NOT use Python, pandas, or any non-SQL syntax
- Do NOT wrap in markdown code blocks
- The table name is always `data`
- Return ONLY the SQL query, nothing else
```

**User message:** `{user's natural language prompt}`

**Retry prompt (on error):**
```
The previous query failed with this error: {duckdbError}
Previous query: {sql}
Please fix the SQL and return only the corrected query.
```

**Anthropic adapter:**
```ts
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 500,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
})
return response.content[0].text.trim()
```

**OpenAI adapter:**
```ts
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  max_tokens: 500,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ]
})
return response.choices[0].message.content.trim()
```

**Privacy enforcement:** The prompt contains ONLY `schema columns` + `20 sample rows`. The full CSV never leaves the browser.

## Testing
✅ Prompt for "total sales by region" generates valid GROUP BY SQL  
✅ Generated SQL contains no Python/pandas syntax  
✅ On DuckDB error, AI is re-prompted and returns corrected SQL  
✅ Network tab shows only 20 rows sent to AI API, not full CSV  
✅ Anthropic adapter and OpenAI adapter both return clean SQL strings  

---

# Module 5: Query Executor

**Estimated Complexity:** M  
**Estimated Files:** ~4  
**Key Risks:** User-edited SQL must be sanitized (no DROP/DELETE/INSERT); large results must be paginated before render

## Requirements
- Display generated SQL in a read-only code block (monospace, syntax highlighted)
- "Edit SQL" toggle — converts to editable textarea
- "Run Query" button executes against DuckDB
- Block destructive SQL: `DROP`, `DELETE`, `INSERT`, `UPDATE`, `CREATE`, `ALTER` → show error
- Show execution time in ms after completion
- Store result in Zustand

## UI Structure
```
┌─ Generated SQL ──────────────────────────────── [Edit] ─┐
│  SELECT region, SUM(revenue) as total                    │
│  FROM data GROUP BY region ORDER BY total DESC           │
└──────────────────────────────────────── [▶ Run Query] ──┘
  ⏱ Executed in 847ms · 12 rows returned
```

## Technical Implementation

**Destructive SQL guard:**
```ts
const BLOCKED = /^\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE)/i
if (BLOCKED.test(sql)) throw new Error('Only SELECT queries are allowed')
```

**Execute:**
```ts
const conn = await db.connect()
const result = await conn.query(sql) // returns Arrow Table
const rows = result.toArray().map(r => r.toJSON())
const columns = result.schema.fields.map(f => f.name)
await conn.close()
```

## Testing
✅ Valid SELECT executes and returns rows  
✅ `DROP TABLE data` is blocked with clear error message  
✅ Edited SQL is used on re-run (not original AI SQL)  
✅ Execution time displayed after completion  
✅ Result with 100k rows doesn't freeze UI (pagination in Module 6 handles render)  

---

# Module 6: Result Table

**Estimated Complexity:** M  
**Estimated Files:** ~3  
**Key Risks:** Rendering 100k rows will crash browser — must paginate

## Requirements
- TanStack Table with: pagination (50 rows/page), column sort, global search filter
- Column headers show inferred type icon
- Numbers right-aligned, dates formatted, strings left-aligned
- Row count summary: "Showing 1–50 of 12,847 rows"
- Sticky header

## Technical Implementation

```ts
const table = useReactTable({
  data: queryResult.rows,
  columns: queryResult.columns.map(col => columnHelper.accessor(col, {...})),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: { pagination: { pageSize: 50 } }
})
```

## Testing
✅ 100,000 row result renders without freeze (pagination at 50/page)  
✅ Clicking column header sorts ascending then descending  
✅ Search filter narrows visible rows  
✅ Pagination controls work correctly  

---

# Module 7: Result Chart

**Estimated Complexity:** M  
**Estimated Files:** ~4  
**Key Risks:** AI chart suggestion may not match result shape — must have fallback

## Requirements
- After query result arrives, AI suggests chart type based on result columns shape
- Supported types: BarChart, LineChart, PieChart
- Chart type selector (user can override AI suggestion)
- X-axis / Y-axis column selectors (pre-populated by AI suggestion)
- Chart renders via Recharts, responsive container
- Chart title = user's original prompt (truncated to 60 chars)

**Chart selection logic (client-side, no AI call):**
- 1 string col + 1 number col → Bar chart
- 1 date col + 1 number col → Line chart
- 1 string col + 1 number col + ≤ 8 rows → Pie chart
- Otherwise → Bar chart (safe fallback)

## Testing
✅ "Sales by region" result (string + number) renders as Bar chart  
✅ "Revenue over time" result (date + number) renders as Line chart  
✅ User can switch chart type and chart re-renders  
✅ Chart is responsive (resizes with window)  

---

# Module 8: CSV Export

**Estimated Complexity:** S  
**Estimated Files:** ~1  
**Key Risks:** None

## Requirements
- "Download CSV" button in result toolbar
- Filename: slugified version of user prompt + timestamp (e.g. `total-sales-by-region-20240115.csv`)
- Uses Papa Parse `unparse()` to convert result rows back to CSV string
- Triggers browser download via Blob + `URL.createObjectURL`

## Technical Implementation
```ts
const csv = Papa.unparse({ fields: result.columns, data: result.rows })
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url; a.download = filename; a.click()
URL.revokeObjectURL(url)
```

## Testing
✅ Download button produces a valid `.csv` file  
✅ Downloaded file row count matches `QueryResult.rowCount`  
✅ Filename contains slugified prompt text  

---

# Module 9: Session History

**Estimated Complexity:** S  
**Estimated Files:** ~3  
**Key Risks:** None — in-memory only, simple list

## Requirements
- Left sidebar showing list of past queries in current session
- Each entry: prompt text (truncated) + row count + timestamp
- Click entry: loads that query's SQL and result back into main view
- "Re-run" button: re-executes stored SQL against current DuckDB table
- "Copy SQL" button: copies SQL to clipboard
- Cleared on page refresh (in-memory Zustand only)

## Zustand additions
```ts
interface HistorySlice {
  sessions: QuerySession[]
  activeSessionId: string | null
  addSession: (s: QuerySession) => void
  setActiveSession: (id: string) => void
}
```

## Testing
✅ After running 3 queries, sidebar shows 3 entries  
✅ Clicking a history entry restores its SQL and result table  
✅ "Copy SQL" copies correct SQL to clipboard  
✅ Page refresh → sidebar is empty  
