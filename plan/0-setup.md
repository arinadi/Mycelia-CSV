# Module 0: Setup

**Estimated Complexity:** S  
**Estimated Files:** ~8  
**Key Risks:** None — pure scaffolding

## Requirements
- Initialize Next.js 15 with App Router and `output: 'export'` in next.config.js
- Configure Tailwind CSS 4.x with custom design tokens (colors, fonts)
- Install and configure all dependencies with pinned versions
- Set up TypeScript strict mode
- Create global Zustand store skeleton
- Set up folder structure conventions

## UI Structure
N/A — setup only. No UI components in this module.

## Data & API
N/A

## Technical Implementation

**Folder structure:**
```
src/
├── app/
│   ├── layout.tsx          # Root layout, dark theme body class
│   ├── page.tsx            # Main SPA page
│   └── globals.css         # Tailwind base + CSS vars
├── components/
│   ├── ui/                 # Primitive components (Button, Input, Badge)
│   └── features/           # Feature-specific components (per module)
├── lib/
│   ├── store.ts            # Zustand global store
│   ├── types.ts            # All TypeScript interfaces
│   └── utils.ts            # Shared utilities
├── workers/
│   └── csv-parser.worker.ts  # Web Worker for Papa Parse
```

**next.config.js:**
```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
}
```

**CSS variables in globals.css:**
```css
:root {
  --bg: #0f1117;
  --surface: #1a1d27;
  --border: #2d3149;
  --accent: #6366f1;
  --text: #f1f5f9;
  --muted: #94a3b8;
}
```

**Dependencies to install:**
```bash
npx create-next-app@15 csv-ai-reporter --typescript --tailwind --app
npm install zustand@5 papaparse@5 @duckdb/duckdb-wasm@1 recharts@2 @tanstack/react-table@8
npm install openai@4 @anthropic-ai/sdk@0
npm install -D @types/papaparse
```

## Testing
✅ `npm run build` completes with no errors  
✅ `out/` directory generated (static export)  
✅ No TypeScript errors (`tsc --noEmit`)  
✅ No ESLint errors  
✅ Zustand store importable from any component  
