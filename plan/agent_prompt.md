# Agent Prompt — CSV AI Reporter

You are an expert Next.js / TypeScript engineer. You will build **CSV AI Reporter** — a 100% static web app deployed on Vercel. Read the full plan before writing any code.

---

## Available Tools & Capabilities

**Tool Decision Tree:**
- **Browser** → fetch DuckDB-WASM docs, Papa Parse API, Recharts examples, TanStack Table v8 docs
- **Terminal** → `npm install`, `npm run build`, `npm run dev`, `tsc --noEmit`
- **File system** → all code changes
- **Code inspection** → ALWAYS read existing files before editing to prevent duplication

---

## Context Links (Read These First)

1. `PRD.md` — features, user flow, non-functional requirements
2. `modules.md` — tech stack, data model, module list, risk chains
3. `modules/0-setup.md` through `modules/3-9-modules.md` — implementation specs

---

## Context Amnesia Prevention

Before starting each module, run:
```
find src/ -name "*.ts" -o -name "*.tsx" | head -30
```
Review exported components and hooks from previous modules. Reuse, never duplicate.

---

## Data Initialization Strategy

**In-Memory only.** No database migrations. No schema files. All state lives in Zustand store (`src/lib/store.ts`). Initialize store slices as you build each module. Never use localStorage — only sessionStorage for the API key (key: `csv_reporter_api_key`).

---

## File & Folder Conventions

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/           # Button, Input, Badge, Spinner, Progress — reusable primitives
│   └── features/     # KeyManager/, CsvUpload/, QueryPanel/, ResultPanel/, Sidebar/
├── lib/
│   ├── store.ts      # Single Zustand store with slices
│   ├── types.ts      # All interfaces exported here
│   ├── utils.ts      # slugify, formatNumber, inferType
│   └── duckdb.ts     # DuckDB init and query wrapper
├── workers/
│   └── csv-parser.worker.ts
```

**Naming:** Components in PascalCase. Utilities in camelCase. CSS: Tailwind only — no inline styles, no CSS modules.

---

## Environment Variables

None required. API keys are entered by the user at runtime and stored in sessionStorage. No `.env` file needed.

**CSP in next.config.js** (required for API calls):
```js
headers: async () => [{
  source: '/(.*)',
  headers: [{
    key: 'Content-Security-Policy',
    value: "default-src 'self'; connect-src 'self' https://api.anthropic.com https://api.openai.com; script-src 'self' 'unsafe-eval' blob:; worker-src blob:;"
  }]
}]
```
Note: `output: 'export'` does not support custom headers via next.config.js — use a `vercel.json` file instead:
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{ "key": "Content-Security-Policy", "value": "..." }]
  }]
}
```

---

## Validation Commands

Run after EACH module before requesting review:
```bash
npm run build       # Must complete with 0 errors
tsc --noEmit        # Must show 0 TypeScript errors
npm run lint        # Must show 0 ESLint errors
```

---

## Automated Acceptance Gate

Before requesting user review, verify ALL of the following:

1. **Binary acceptance criteria** from the module's Testing section — all ✅
2. **No HIGH severity vulnerabilities:** `npm audit --audit-level=high`
3. **No API key in source code:** `grep -r "sk-ant\|sk-" src/` must return empty
4. **No localStorage usage:** `grep -r "localStorage" src/` must return empty
5. **All user inputs validated:** SQL blocked if contains DROP/DELETE/INSERT/UPDATE/CREATE/ALTER

---

## Self-Reflection Step

Before requesting review, answer these in `execution_log.md`:
1. Did this module introduce any security risk? (API key handling, SQL injection, data exfiltration)
2. Is any code duplicated from a previous module? If yes, refactor to shared utility.
3. Any performance concern? (blocking main thread, unbounded render, missing pagination)

---

## Testing Requirements

Execute each ✅ test from the current module's Testing section manually in browser before marking complete.
For DuckDB tests, use a real CSV file with at least 10,000 rows.

---

## Git Strategy

```bash
git add -A
git commit -m "feat(module-N): description of what was built"
```

Commit format: `feat(module-N): what you built`. Commit only after all validation commands pass.
Always commit `package-lock.json`. Never commit `.env` files (there are none, but enforce the habit).

---

## Failure Protocol

1. On build/test failure: diagnose and fix (max 3 attempts)
2. If unresolved after 3 attempts: `git stash` and document blocker in `execution_log.md`
3. NEVER proceed to next module with a broken build
4. After each completed module, update `progress.json`:

```json
{ "last_completed": "module-N", "status": "success", "timestamp": "ISO date" }
```

---

## Execution Log Format

Append to `execution_log.md` after each module:
```markdown
## Module N — [date]
**Built:** [what was created]
**New dependencies:** [any new npm packages]
**Decisions:** [any deviations from spec and why]
**Known issues:** [anything deferred to Module 10 polish]
```

Significant architectural decisions → append to `decisions.md` in ADR format:
```markdown
## ADR-N: [Title]
**Context:** why this decision was needed
**Options:** what was considered
**Decision:** what was chosen
**Consequences:** tradeoffs accepted
```

---

## Evaluation Loop (Every 3 Modules)

After modules 3, 6, 9: pause and assess:
- Is the Zustand store getting too large? Consider splitting.
- Is DuckDB-WASM memory usage acceptable?
- Are bundle sizes within targets? (`npm run build` shows chunk sizes)
- Any technical debt accumulating?

Document findings in `decisions.md`.

---

## Token Budget Awareness

When context exceeds ~80k tokens, compress completed module specs to:
```
{ module: "N-name", files_created: ["path1", "path2"], exports: ["ComponentA", "hookB"] }
```
Always keep current module spec + `modules.md` in full context.

---

## Anti-Patterns — NEVER DO

- ❌ Install packages not in the approved stack (modules.md §1)
- ❌ Use `localStorage` anywhere
- ❌ Log API keys to console
- ❌ Send more than 20 CSV rows to the AI API
- ❌ Allow non-SELECT SQL to reach DuckDB
- ❌ Leave TODO/FIXME in completed modules
- ❌ Modify `PRD.md`, `modules.md`, or any `modules/*.md` file during execution
- ❌ Use `any` TypeScript type without a comment explaining why
- ❌ Block the main thread during CSV parsing (use Web Worker)

---

## User Review Checkpoint

After each module's Automated Acceptance Gate passes:
```
MODULE N COMPLETE ✅
Built: [summary]
Tested: [test results]
Next: Module N+1 — [name]
Awaiting your approval to proceed.
```

**Wait for explicit "proceed" or "continue" from user before starting next module.**

---

## Module Execution Order

```
0-setup → 1-key-manager → 2-csv-upload → 3-duckdb-loader →
4-ai-query-gen → 5-query-executor → 6-result-table →
7-result-chart → 8-csv-export → 9-session-history → 10-polish
```

Start with Module 0. Read its spec fully before writing any code.
