# Module 2: CSV Upload & Schema Preview

**Estimated Complexity:** M  
**Estimated Files:** ~5  
**Key Risks:** Large files must not block main thread; schema inference must handle dirty data

## Requirements
- Drag-and-drop zone OR file picker (accept `.csv` only)
- Stream-parse first 200 rows using Papa Parse in a Web Worker (non-blocking)
- Infer column data types from sample: `number`, `date`, `boolean`, `string`
- Display schema preview table: column name | inferred type | sample values (3)
- Show total row count (Papa Parse full file scan for row count, streaming)
- User can correct inferred type via dropdown per column
- "Confirm Schema" button → advances to query step
- "Replace file" button to start over

## UI Structure

**States:**
1. **Empty** — large drag-drop zone with icon + "Drop your CSV here or click to browse"
2. **Parsing** — progress bar + "Reading file... (X MB processed)"
3. **Preview** — schema table + row count + Confirm button

**Schema table columns:**
| Column Name | Type | Sample Values | Override |
|------------|------|--------------|---------|
| order_date | 📅 date | 2024-01-15, 2024-03-20 | [date ▼] |
| revenue | 🔢 number | 15420.5, 8900.0 | [number ▼] |
| region | 🔤 string | "North", "South" | [string ▼] |

File info bar: `orders_2024.csv — 2,847,293 rows — 184 MB`

## Data & API

References `CsvFile` and `Schema` entities from modules.md.

**Zustand slice:**
```ts
interface CsvSlice {
  file: File | null
  fileName: string
  totalRows: number
  fileSizeBytes: number
  schema: Column[]
  parseStatus: 'idle' | 'parsing' | 'done' | 'error'
  setFile: (f: File) => void
  updateColumnType: (colName: string, type: ColumnType) => void
  confirmSchema: () => void
  reset: () => void
}

interface Column {
  name: string
  inferredType: 'number' | 'date' | 'boolean' | 'string'
  userOverrideType?: ColumnType
  sampleValues: string[]
}
```

## Technical Implementation

**Web Worker (`workers/csv-parser.worker.ts`):**
```ts
// Receives: File object
// Returns: { schema: Column[], totalRows: number }
// Uses Papa Parse streaming:
Papa.parse(file, {
  worker: false,  // already in worker thread
  preview: 200,   // first 200 rows for schema
  complete: (results) => postMessage({ type: 'schema', data: results })
})
// Second pass for row count (streaming, no data stored):
Papa.parse(file, {
  chunk: (results, parser) => { rowCount += results.data.length },
  complete: () => postMessage({ type: 'rowCount', count: rowCount })
})
```

**Type inference logic (`lib/inferType.ts`):**
- number: `!isNaN(parseFloat(val)) && isFinite(val)`
- date: try `new Date(val)` — valid if not "Invalid Date" and value looks date-like
- boolean: val.toLowerCase() in `['true','false','yes','no','1','0']`
- string: fallback

**File size warning:** Show yellow warning banner if file > 500MB suggesting user may experience slower processing.

## Testing
✅ Drag a 10MB CSV → schema appears within 2s  
✅ Drag a 500MB CSV → UI remains responsive during parsing (no freeze)  
✅ Date columns correctly inferred from ISO date strings  
✅ Number columns correctly inferred from float strings  
✅ User can override type → override stored in Zustand  
✅ "Replace file" resets all state cleanly  
✅ Only `.csv` files accepted (`.xlsx` shows "Only CSV files supported")
