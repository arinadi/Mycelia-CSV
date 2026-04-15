# Mycelia CSV Reporter

A local-first, privacy-focused CSV analysis tool powered by DuckDB-WASM and AI.

## Features
- **Local Analytics**: Large CSV files (up to 2GB) are processed entirely in your browser using DuckDB-WASM.
- **Natural Language Query**: Ask questions in plain English and get SQL answers instantly.
- **Dynamic Model Selection**: Support for OpenAI, Anthropic, and Gemini (v1beta) with custom base URL support.
- **Smart Visualization**: Automatic chart inference (Bar, Line, Pie) based on data shape.
- **Privacy Native**: API keys and data never leave your browser. Stored in session memory only.
- **Session History**: Track and revisit previous queries in a dedicated sidebar.
- **Export**: Generate and download CSV reports from your query results.

## Technical Architecture
- **Frontend**: Vite 6 + React 19 (SPA)
- **Engine**: DuckDB-WASM with browser-side CSV ingestion
- **State**: Zustand with session-only persistence
- **Styling**: Vanilla CSS for premium aesthetics

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) with your browser to see the result. (Note: The default port has been changed to 4000).

## Test Data Generation

The project includes a utility script to generate synthetic CSV data with complex JSON and PHP Serialized structures for testing.

**Requirements**: Python 3.x

### Generate Sample Data (Small)
Generates 100 rows of diverse data:
```bash
python scripts/generate_test_data.py --rows 100 --output sample_data.csv
```

### Stress Test Generation (Large)
Generates 1 million rows for performance testing (results in ~800MB CSV):
```bash
python scripts/generate_test_data.py --rows 1000000 --output stress_test_1m.csv
```

## Environment & Security
- **No `.env` required**: This app is designed to be fully client-side.
- **CORS Handling**: When using custom OpenAI endpoints, ensure the endpoint supports CORS requests from your origin.

## Development
- `npm run build`: Verified static production build.
- `tsc --noEmit`: Strict type checking.
- `eslint .`: Linting verification.

## License
MIT
