# Walkthrough - Phase 3: Analytical Engine & AI Integration

We have successfully completed Phase 3 of the **Mycelia CSV Reporter** project. This phase focused on integrating the local analytical engine (DuckDB-WASM) and implementing the AI-powered natural language to SQL layer.

## 🚀 Key Achievements

### 1. Analytical Engine (DuckDB-WASM)
- **Local-First Processing**: Integrated DuckDB-WASM to handle large CSV files (up to 2GB) entirely in the browser.
- **Lazy Initialization**: The engine only loads when the user confirms the schema, preserving resources.
- **WASM-Optimized**: Using JsDelivr CDN for efficient WASM bundle delivery with modern browser features.

### 2. AI SQL Generation & Dynamic Models
- **Dynamic Model Selection**: The app now fetches available models directly from the provider (OpenAI/Gemini).
- **Custom Endpoints**: Full support for OpenAI-compatible proxies and custom base URLs.
- **Gemini Specialist**: Implemented the specialized `v1beta` model listing protocol for Google Gemini.
- **SQL Safety**: Integrated basic guards to prevent destructive SQL commands (DROP, DELETE, etc.).

### 3. Visualization & Results
- **Rich Data Table**: Implemented a high-performance, paginated result table using **TanStack Table v8**.
- **Auto-Chart Inference**: Automatic selection of Bar, Line, or Pie charts based on the query result shape.
- **Export Capabilities**: Direct-to-browser CSV export for generated reports.

### 4. Session Management
- **Query History**: A dedicated sidebar tracks your session queries, allowing you to quickly jump back to previous results.
- **Non-Persistent Security**: All API keys and session data are stored in `sessionStorage` or application memory only.

## 📁 Changes

### Core Logic
- [duckdb.ts](file:///d:/csv_reporter/src/lib/duckdb.ts): WASM initialization and query execution.
- [ai-service.ts](file:///d:/csv_reporter/src/lib/ai-service.ts): Unified AI interface with dynamic model fetching.
- [store.ts](file:///d:/csv_reporter/src/lib/store.ts): Expanded with DuckDB, AI, and History slices.

### UI Components
- [KeyManager.tsx](file:///d:/csv_reporter/src/components/features/KeyManager/KeyManager.tsx): Added Base URL and dynamic Model dropdown.
- [QueryPanel.tsx](file:///d:/csv_reporter/src/components/features/QueryPanel/QueryPanel.tsx): Natural language input, SQL preview, and "Thinking" state.
- [ResultPanel.tsx](file:///d:/csv_reporter/src/components/features/ResultPanel/ResultPanel.tsx): Orchestrates Table, Chart, and Export actions.
- [Sidebar.tsx](file:///d:/csv_reporter/src/components/features/Sidebar/Sidebar.tsx): Session history tracker.

## 🛠️ Verification Results

- ✅ **Build Success**: `npm run build` passed successfully (Static Export).
- ✅ **Type Safety**: `tsc --noEmit` passed with no errors.
- ✅ **Port Check**: Dev server is configured to run on Port **4000**.
- ✅ **Linting**: All ESLint errors and warnings resolved.

> [!IMPORTANT]
> **Port 4000**: Please remember that the dev server now runs on `http://localhost:4000`.

> [!TIP]
> **Gemini Support**: When using Gemini, ensure your API key has access to the `v1beta` models list endpoint.
