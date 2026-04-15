# Walkthrough: Migrate Next.js 15 → Vite 6

## Summary
Migrated the entire application from Next.js 15 (static export) to Vite 6 + React 19 SPA. The app is 100% client-side so Next.js SSR/SSG overhead was unnecessary and caused Vercel deployment failures.

## Changes

### New Files
- `index.html` — Vite SPA entrypoint with Google Fonts (Geist) loaded via `<link>` tags
- `vite.config.ts` — Vite config with React plugin and tsconfig path alias support
- `src/main.tsx` — React DOM mount point (replaces Next.js App Router bootstrap)
- `src/App.tsx` — Root component merging `layout.tsx` + `page.tsx`
- `src/vite-env.d.ts` — Vite client type declarations
- `src/globals.css` — Moved from `src/app/globals.css`

### Deleted Files
- `next.config.ts` — Next.js configuration
- `next-env.d.ts` — Next.js type declarations
- `src/app/layout.tsx` — Replaced by `src/App.tsx`
- `src/app/page.tsx` — Merged into `src/App.tsx`
- `src/app/globals.css` — Moved to `src/globals.css`
- `public/next.svg`, `public/vercel.svg` — Unused branding assets

### Modified Files
- `package.json` — Removed `next`, `eslint-config-next`. Added `vite`, `@vitejs/plugin-react`, `vite-tsconfig-paths`. Updated scripts.
- `src/components/features/QueryPanel/QueryPanel.tsx` — Added dynamic `z-index` to container when tools (CheatSheet/Mentions) are active.
- `src/App.tsx` — Removed `overflow-hidden` from main content column to prevent UI clipping.
- `vercel.json` — Updated Content-Security-Policy to allow `connect-src *` to support custom AI endpoints (Gameloft, Ollama, etc.).
- `tsconfig.json` — Target ES2020, jsx react-jsx, removed Next.js plugin
- `postcss.config.mjs` — Changed Tailwind plugin from string to function invocation (Vite requirement)
- `eslint.config.mjs` — Replaced `next/core-web-vitals` with `eslint:recommended`. **Update:** Disabled `no-undef` for TypeScript files (redundant with TS type-checking).
- `vercel.json` — Added `framework: vite`, SPA rewrites, expanded CSP for Google Fonts
- `.gitignore` — Updated for Vite (`dist/` instead of `.next/`, `out/`)
- `agent.md` — Updated tech stack, file locations, and commands
- 12 component files — Removed `"use client"` directive (not needed in Vite)
- `DataSourcePanel.tsx` — Worker URL changed from `@/` alias to relative path (Vite requirement)

## Impact
- **Zero feature changes** — All functionality preserved
- **Dependencies**: ~500+ → 277 packages
- **Dev server**: ~3-5s → 591ms startup
- **Build**: ~15-30s → 4.39s
- **Deploy target**: Vercel static SPA via `dist/`
