# Agent Context: Mycelia CSV Reporter

## Project Overview
Mycelia CSV Reporter is a local-first, privacy-focused CSV analysis tool. It uses DuckDB-WASM for safe, browser-side SQL execution and AI for natural language to SQL translation.

## Tech Stack
- **Framework**: Vite 6 + React 19 (SPA)
- **Engine**: DuckDB-WASM
- **State**: Zustand (Session-only persistence)
- **AI**: Dynamic (Gemini, OpenAI, Anthropic) via fetch
- **UI**: Tailwind CSS v4 + Vanilla CSS
- **Deployment**: Vercel (Static SPA)

## Current Status (Migrated to Vite - COMPLETED)
- [x] Vite migration from Next.js 15 complete
- [x] DuckDB-WASM integration complete
- [x] AI SQL Auto-Correction (retry loop on SQL errors)
- [x] Advanced Charting overrides (UI for type/axis)
- [x] Global Error Boundary for recovery
- [x] Accessibility (A11y) & UX Polish complete
- [x] Zero TS errors & clean production build

## Key File Locations
- `src/App.tsx`: Root application component
- `src/main.tsx`: Vite entrypoint
- `src/lib/duckdb.ts`: Analytical engine logic
- `src/lib/ai-service.ts`: AI provider logic
- `src/lib/store.ts`: Central state (AppState)
- `src/components/features/`: Component modules
- `vite.config.ts`: Vite configuration

## Design Decisions
- **ADR-1**: DuckDB initialized lazily via schema confirm button.
- **ADR-2**: No `.env` for API keys; keys entered by user and kept in `sessionStorage`.
- **ADR-3**: Automatic chart type inference based on column types and row count.
- **ADR-4**: Migrated from Next.js to Vite — app is 100% client-side SPA, no SSR needed.

## Development Commands
- `npm run dev`: Starts development server on **port 4000**.
- `npm run build`: Generates static build in `dist/` directory.
- `npm run preview`: Preview production build on port 4000.
