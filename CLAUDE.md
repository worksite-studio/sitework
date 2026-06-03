# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working on this repository.

## Architecture (post-Phase 4)

The active application is a **Vite + React 19 + TypeScript** project at `sitework/`.

The legacy single-file `index.html` was retired in Phase 4 session 13 (June 2026). Earlier history of edits to that file is preserved in git — recover any prior version with `git log --oneline <commit>:index.html`.

Top-level layout:

```
SITEWORK - SaaS/
├── sitework/                    ← the app (Vite + React + TS + Tailwind v4)
│   ├── src/
│   │   ├── App.tsx              ← createBrowserRouter + StateProvider
│   │   ├── main.tsx             ← entry: runs migrateLegacyState() once
│   │   ├── components/          ← shared (AppShell, StatusBadge, FilePicker, ui/*)
│   │   ├── modules/             ← top-level pages + project tabs
│   │   ├── state/               ← reducer, actions, persistence, seed
│   │   ├── lib/                 ← pure utilities (substantiation, certExpiry, formatters)
│   │   └── types/               ← entity types (one file per entity)
│   ├── tests/e2e/               ← Playwright
│   ├── scripts/extract-seed.mjs ← regenerates seed.ts from old index.html (now obsolete)
│   └── package.json
├── ARCHITECTURE.md              ← codebase tour, reducer catalogue, design tokens
├── DATA_MODEL.md                ← every entity, current + Phase 5 target fields
├── CONTRACTS_REFERENCE.md       ← Australian construction contract law → feature implications
├── HANDOFF.md                   ← evaluator-facing project overview
├── ROADMAP.md                   ← phase tracker + session log
└── WORKFLOW.md                  ← how to run a session
```

## Running the app

```bash
cd sitework
npm install   # first time
npm run dev   # serves http://localhost:5173 with HMR
```

The Vite dev server auto-reloads on save. No bracket-balance dance.

## The five npm scripts you'll use most

```bash
cd sitework

npm run dev          # live dev server on :5173
npm run typecheck    # tsc -b --noEmit
npm run test         # vitest run (unit + component tests)
npm run test:watch   # vitest in watch mode
npm run test:e2e     # playwright — boots Vite then runs specs
npm run lint         # eslint
npm run format       # prettier --write
npm run build        # tsc + vite build → dist/
```

Required before every commit: `format:check`, `lint`, `typecheck`, `test`, `build`. CI runs all of these on PR.

## State management

A single `useReducer` lives in `src/state/StateProvider.tsx`. The reducer (`src/state/reducer.ts`) handles 53 typed actions; the discriminated union is in `src/state/actions.ts`. Adding a new action: extend the union AND add the case arm — TypeScript's `assertNever` default in the reducer flags missing handlers at compile time.

State is persisted to `localStorage` under `sw_state_v2` via `src/state/persistence.ts`. A `migrateLegacyState()` runs once on first load to import any data left under `sw_state_v1` from the old single-file app.

Read state in a component:
```ts
import { useAppState, useDispatch } from '@/state/context'

const state = useAppState()
const dispatch = useDispatch()
dispatch({ type: 'ADD_INVOICE', projectId, invoice })
```

In a project-scoped tab, prefer `useProject()` (`src/modules/project/useProject.ts`) which already resolves the URL `:projectId` param.

## Where each piece lives

| Concern | Location |
|---|---|
| Routes | `src/App.tsx` — `createBrowserRouter` |
| App shell | `src/components/AppShell.tsx` — sidebar + header |
| Top-level pages | `src/modules/<Name>/` |
| Project tabs | `src/modules/project/<Tab>/` |
| UI primitives | `src/components/ui/` (Button, Input, Field, Dialog, Card, EmptyState, KpiTile, ExpiryChip) |
| Reducer + actions | `src/state/reducer.ts`, `src/state/actions.ts` |
| Entity types | `src/types/` (one file per entity, barrel-exported via `index.ts`) |
| Design tokens | `src/index.css` — `@theme` block (Tailwind v4) |
| Currency / date formatters | `src/lib/formatCurrency.ts`, `formatDate.ts` |
| Substantiation gate (1.5-A) | `src/lib/substantiation.ts` |
| Cert / insurance expiry helper | `src/lib/certExpiry.ts` |

## Conventions

- **Path alias:** `@/` resolves to `src/`. Always use it (`@/components/ui`, `@/state/context`).
- **Component files** export only React components — hooks live in `*.ts` files (e.g. `src/state/context.ts`). The react-refresh lint rule enforces this.
- **Forms** use the `Field` primitive — it auto-wires `htmlFor` via `useId()` + `cloneElement`. Required fields render an asterisk inside the label; selectors that need to match a required field's accessible name should use `/^Name\*$/` rather than exact match.
- **Reducer actions** never mutate input. The helpers `updateWhere`, `pushByProject`, `patchByProject`, `filterByProject`, `updateProject` in `src/state/reducer.ts` enforce this and keep the switch arms readable.
- **e2e selectors** lean on roles + headings to avoid strict-mode collisions with overlapping copy. When `getByText` matches multiple elements, use `{ exact: true }` or anchor with `getByRole('heading')`.

## Companion docs

| Doc | When to consult |
|---|---|
| `ARCHITECTURE.md` | Full minified-name → friendly-name map (still useful when reading old commits), reducer catalogue, design decisions |
| `DATA_MODEL.md` | Every entity's fields and Phase 5 Postgres target shape |
| `CONTRACTS_REFERENCE.md` | When a feature touches statutory compliance — source of truth for the legal layer |
| `WORKFLOW.md` | How to run a session, branching/commit conventions |
| `ROADMAP.md` | Phase tracker + session log — first thing to read each session |
| `HANDOFF.md` | Plain-English overview if you're new to the project |
