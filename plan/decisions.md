# Architectural Decisions — CSV AI Reporter

## ADR-1: DuckDB VIEW instead of TABLE for CSV ingestion
**Context:** Loading millions of CSV rows into a DuckDB TABLE would require reading the entire file into WASM memory, risking OOM on large files.  
**Options:** `CREATE TABLE` (full load) vs `CREATE VIEW` (lazy read via `read_csv_auto`)  
**Decision:** Use `CREATE VIEW data AS SELECT * FROM read_csv_auto('data.csv')` with `registerFileHandle` using `BROWSER_FILEREADER` protocol.  
**Consequences:** DuckDB reads file lazily per query. Memory usage stays low. Trade-off: first query on a cold view may be slightly slower, but subsequent queries benefit from DuckDB's internal caching.

## ADR-2: sessionStorage for API key (not localStorage)
**Context:** API key must survive page navigation within a session but not persist across sessions (security risk if user on shared machine).  
**Options:** In-memory Zustand only (lost on refresh), localStorage (persists forever), sessionStorage (cleared on tab close)  
**Decision:** sessionStorage only, key: `csv_reporter_api_key`. In-memory Zustand holds the runtime copy.  
**Consequences:** User must re-enter key if they close the tab. Acceptable UX tradeoff for security.

## ADR-3: Client-side chart type inference (no AI call)
**Context:** Calling AI to suggest chart type would add latency and API cost per query.  
**Options:** AI-suggested chart type (extra API call) vs deterministic rule-based inference  
**Decision:** Rule-based: 1 string + 1 number = Bar; 1 date + 1 number = Line; ≤8 rows = consider Pie.  
**Consequences:** Works for 90% of common report shapes. Edge cases handled by user's manual chart type override.

## ADR-4: vercel.json for CSP headers (not next.config.js)
**Context:** `output: 'export'` in Next.js 15 disables the `headers()` function in next.config.js.  
**Options:** Middleware (not compatible with static export), vercel.json headers, meta http-equiv tags  
**Decision:** `vercel.json` with `headers` array. Allows Anthropic and OpenAI API origins.  
**Consequences:** CSP only enforced on Vercel. Local dev has no CSP. Add note in README.
