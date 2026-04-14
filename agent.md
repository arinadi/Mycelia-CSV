# Agent Context: Mycelia CSV Reporter

## Project Overview
Mycelia CSV Reporter is a local-first, privacy-focused CSV analysis tool. It uses DuckDB-WASM for safe, browser-side SQL execution and AI for natural language to SQL translation.

## Tech Stack
- **Framework**: Next.js 15 (Static Export)
- **Engine**: DuckDB-WASM
- **State**: Zustand (Session-only persistence)
- **AI**: Dynamic (Gemini, OpenAI, Anthropic) via fetch
- **UI**: Vanilla CSS + Tailwind, Radix UI-inspired components

## Current Status (End of Phase 3)
- [x] Port 4000 configured
- [x] DuckDB-WASM integration complete
- [x] AI SQL Generation with dynamic model fetching
- [x] Gemini v1beta support
- [x] Results Table & Auto-Charting
- [x] Session History & CSV Export

## Key File Locations
- `src/lib/duckdb.ts`: Analytical engine logic
- `src/lib/ai-service.ts`: AI provider logic
- `src/lib/store.ts`: Central state (AppState)
- `src/components/features/`: Component modules

## Design Decisions
- **ADR-1**: DuckDB initialized lazily via schema confirm button.
- **ADR-2**: No `.env` for API keys; keys entered by user and kept in `sessionStorage`.
- **ADR-3**: Automatic chart type inference based on column types and row count.

## Development Commands
- `npm run dev`: Starts development server on **port 4000**.
- `npm run build`: Generates static export in `out/` directory.
