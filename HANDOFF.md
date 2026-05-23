# HANDOFF.md — Developer handoff for SITEWORK

This document is for a developer evaluating taking SITEWORK to its next phase. It complements `CLAUDE.md` (codebase guide), `ROADMAP.md` (phase tracker + session log), `WORKFLOW.md` (operating manual) and `CONTRACTS_REFERENCE.md` (statutory compliance source of truth).

If you are about to quote on the project, read all five of these before producing an estimate.

---

## 1. What this is

SITEWORK is a construction-finance SaaS for Australian residential builders. The product targets small-to-mid builders running cost-plus and fixed-price contracts under HIA, MBA, and equivalent state-level frameworks (HBA NSW, DBC Act QLD, Building Act WA, etc.).

Differentiators in the target market:
- **Owner-facing open-book report** for cost-plus projects — the standout feature shipped in Phase 1.5.
- **State-aware statutory compliance** — VIC s.13 hard-blocks at project creation, QLD QBCC HWS acknowledgement, deposit cap helper text per state, mandatory clauses surfaced per state/contract form.
- **PC items / Provisional Sums as first-class entities** with margin-on-excess reconciliation per §7.4 of the contracts reference.
- **Cost-plus invoice substantiation** — invoices and progress claims on cost-plus projects require an attached supporting document before save.

Status: functional prototype with localStorage persistence. No backend, no multi-user, no Xero integration, no PDFs (beyond browser print).

---

## 2. Tech stack

| Layer | Current | Target (per ROADMAP) |
|---|---|---|
| Frontend | React 19.2.4 in a single minified `index.html`, JSX runtime, no build step | Vite + React + TypeScript (Phase 4) |
| State | One `useReducer` (`Z1`) wrapped in `Z1Persisted` for localStorage | Same shape, ported to TypeScript |
| Storage | `localStorage["sw_state_v1"]` (versioned key) | Supabase (Phase 5) |
| Styles | Inline CSS-in-JS with design-token objects `d` (colour) and `v` (font) | Tailwind or CSS Modules (Phase 4) |
| Hosting | GitHub Pages on `worksite-studio/sitework` | Vercel (Phase 4+) |
| Auth | None — single-user | Supabase Auth (Phase 5) |

There is no `package.json`, no `node_modules`, no test suite. The app is one HTML file (`index.html`, ~440 KB minified) served by `serve.py` (a 6-line Python `http.server` wrapper on port 3456).

---

## 3. Codebase tour

Start with `CLAUDE.md`. The most important parts:

- **Minified-name map**: `Pc` = root, `Y1v2` = Dashboard, `D1` = Project Overview, `w1` = BOQ row editor, `B1` = Variations, `O1v2` = Invoices, `M1v2` = POs, `Cl1` = Progress Claims, `k1v2` = Defects, `j1v2` = Cash Flow, `Pcps` = PC/PS, `Calx` = Calendar, `Obx` = Open Book, `Z1` = root reducer.
- **Two rendering styles**: most modules use `o.jsx`/`o.jsxs` (newer); a few legacy ones (`Cl1`, `k1v2`, `RF1`, `InvFormV2`, `POFormV2`, `ClaimForm1`) use `React.createElement` directly. The two styles are interchangeable but inconsistent.
- **Editing protocol**: all edits are Python `str.replace` operations on `index.html`. After every edit, bracket balance MUST be `(3, 3, 3)` — verifier script in `CLAUDE.md`. Any other result means a broken edit; `git checkout -- index.html` and retry.

Key reducer actions (see `Z1` for the list): `ADD_PROJECT`, `UPDATE_PROJECT`, `ADD_CODE`, `UPDATE_CODE`, `DELETE_CODE`, `IMPORT_TEMPLATE_INTO_BOQ`, `ADD_CLAIM`, `UPDATE_CLAIM`, `ADD_INVOICE`, `UPDATE_INVOICE`, `ADD_VARIATION`, `UPDATE_VARIATION`, `RECEIVE_PURCHASE`, `ADD_TIMESHEET`, `DELETE_TIMESHEET`, `ADD_RFI`, `UPDATE_RFI`, `ADD_DIARY`, `ADD_MILESTONE`, `UPDATE_MILESTONE`, `CREATE_ESTIMATE_FROM_TEMPLATE`, `PROMOTE_ESTIMATE`, `ADD_PRIME_COST`, `UPDATE_PRIME_COST`, `DELETE_PRIME_COST`, `ADD_PROVISIONAL_SUM`, `UPDATE_PROVISIONAL_SUM`, `DELETE_PROVISIONAL_SUM`, `UPDATE_SETTINGS`.

Project tabs (in order, as defined in the `m` array): Overview, BOQ & Budget, PC & PS, Variations, Progress Claims, Invoices, Purchase Orders, Schedule, Site Diary, Client Selections, Timesheets, Defects, **Calendar**, **Open Book**, Cash Flow, RFI Register.

---

## 4. What's shipped (phase by phase)

### Phase 0 — UI/UX Polish & Module Audit (0-A through 0-H) — complete
Every module works correctly with real seed data, edge cases handled, state-aware statutory compliance foundations in place. See ROADMAP sections 0-A through 0-H for line items.

### Phase 1 — LocalStorage Persistence — complete
`Z1Persisted` higher-order reducer persists to `sw_state_v1`. Lazy initializer in `Pc` reads it on mount with seed fallback. "Reset to Demo Data" button in Settings.

### Phase 1.5 — Compliance Workflows — complete (session 28)
1. **PC items + PS items** as first-class entities with margin-on-excess reconciliation.
2. **Cost-plus invoice + progress claim substantiation** — file picker, save blocked on cost-plus without a doc.
3. **Calendar tab** aggregating milestones / defects / insurance + cert expiries with EXPIRED/≤30d chips.
4. **Insurance certificate attachments** on subcontractors (typed: PL / WC / PI / SWMS / Other).
5. **Owner-facing open-book report** — read-only summary with Print/Save PDF.
6. **BOQ cost-code form upgrade** — auto-numbered Code + 43-category dropdown (fixes "no dropdown" UX gap on a fresh project).
7. **BOQ template import** — pull a template's codes into the project's BOQ; dedupes by code.

### Phase 2 — Architecture Documentation — not started
ARCHITECTURE.md + DATA_MODEL.md mapping the codebase before the React migration.

### Phase 3 — PDF & Print Export — not started
Print CSS + react-pdf for Progress Claim PDFs, BOQ Export, Retention / FFC Certificate, Tax Invoice. (The Open Book report uses `window.print()` as an interim shipping path.)

### Phase 4 — Scaffold proper React project — not started
**This is the most important next step for a new developer.** Move from single-file to Vite + React + TypeScript. Extract each module into its own file under `/src/modules/`. Extract design tokens to `/src/design/`. Extract reducer to `/src/state/`. Set up ESLint + Prettier + GitHub Actions CI to Vercel.

### Phase 5 — Backend, auth, multi-user — not started
Supabase. Schema from DATA_MODEL.md. RLS. Immutable audit log per `CONTRACTS_REFERENCE.md` §7.7. Owner portal (the open-book report becomes shareable).

### Phase 6 — Xero integration — not started
### Phase 7 — Rawlinson rate lookup — not started
### Phase 8 — Billing & go-live — not started

---

## 5. Known issues / tech debt

| Area | Issue | Workaround / fix path |
|---|---|---|
| Build | No build step, no test suite | Phase 4 migration to Vite |
| Editing | Minified JS edited via Python `str.replace` | Phase 4 un-minifies |
| Style mixing | `o.jsx` vs `React.createElement` co-exist | Pick one during Phase 4 port |
| Types | No TypeScript | Phase 4 adds it |
| File upload | Files stored as `{name, size, type}` metadata only (no `dataUrl` persistence to localStorage) | Acceptable for prototype; full upload requires backend (Phase 5) |
| URL routing | None — all nav is React state | Phase 4 picks a router |
| Open-book sharing | No token-protected URL; sharing is screenshot/print | Phase 5 adds RLS-protected owner portal |
| Statutory warranty | Calendar surfaces insurance + cert expiries but not per-state statutory warranty periods (NSW 6yr/2yr, VIC 10yr flat, etc.) | Deferred; needs project completion-date field plus state-keyed warranty rules |
| Forecast / cash flow | Cash-flow module is a simple committed-vs-paid view, not a true forecast model | Future work; Phase 8 candidate |

---

## 6. Recommended first step for a new developer

Do not rewrite from scratch. Port instead.

1. **Un-minify** `index.html` with Prettier or a JS beautifier. Commit the un-minified version on a branch.
2. **Scaffold Vite + React + TypeScript**, copy the JSX into per-module files keeping the same component boundaries (`D1.tsx`, `B1.tsx`, etc.). Use the minified-name → module map from `CLAUDE.md`.
3. **Extract design tokens** (`d` and `v`) into `/src/design/tokens.ts`. Extract reducer (`Z1`) into `/src/state/reducer.ts`. Extract seed data into `/src/state/seed.ts`.
4. **Wire localStorage persistence** the same way it works today — `Z1Persisted` HOR + lazy init.
5. **Add tests** as you go — Vitest + React Testing Library. Start with the reducer (pure function, easy unit tests) and the financial calculations.
6. **Smoke-test every module** against the existing build before retiring `index.html`. The ROADMAP's session log is a useful checklist.

Rough estimate: a competent full-stack developer should complete steps 1-4 in 3-5 days. Step 5-6 is ongoing.

The reducer + data model is the durable value. The minified rendering is disposable. `CONTRACTS_REFERENCE.md` is the source of truth that drives feature decisions and must be respected.

---

## 7. Reference docs

- **`CONTRACTS_REFERENCE.md`** — Australian construction contract law mapped to features. **Authoritative.** Any feature touching statutory obligations (deposit caps, mandatory clauses, retention rules, warranty periods, SOPA timing, owner notifications) must be checked against this document and the current Act/regulation before shipping.
- **`ROADMAP.md`** — phase tracker + session log. 28 sessions of work logged. Each session ends with a one-line summary.
- **`WORKFLOW.md`** — operating manual covering the session loop, branch/PR workflow, bracket-balance discipline, logging conventions.
- **`CLAUDE.md`** — codebase guide. The minified-name map and the bracket-balance check live here.

---

## 8. Data model summary

State is one large object keyed by entity. Most collections are per-project-keyed: `claims[projectId][]`, `invoices[projectId][]` (actually nested on the project record itself in this version), `purchases[projectId][]`, `diary[projectId][]`, `milestones[projectId][]`, `defects[projectId][]`, `rfis[projectId][]`, `timesheets[projectId][]`, `selections[projectId][]`, `primeCostItems[projectId][]`, `provisionalSums[projectId][]`, `retention[projectId]`, `claims[projectId][]`.

Top-level: `projects[]`, `clients[]`, `leads[]`, `subcontractors[]`, `materials[]`, `suppliers[]`, `estimates[]`, `settings{}`.

A project record has: `id`, `name`, `clientId`, `address`, `status`, `startDate`, `margin`, `contractType` (`cost-plus` / `fixed-price`), `state`, `contractForm`, `contractClassification` (`Domestic`/`Commercial`), `estimatedValue`, `isRenovationWithUnknownCost`, `qldHwsAcknowledged`, `codes[]` (with `id`, `code`, `desc`, `budget`, `committed`, `actual`, `vars`), `variations[]`, `invoices[]`, `lineItems{}` (keyed by code id).

A subcontractor record has: `id`, `name`, `trade`, `contact`, `phone`, `email`, `abn`, `licence`, `liabilityExp`, `wcExp`, `liabilityAmt`, `piAmount`, `plAmount`, `swms`, `notes`, `certificates[]` (new in 1.5-E: `{type, expiry, file: {name, size, type}, uploadedAt}`), `rating`, `projects[]`.

A claim record has: `id`, `claimNo`, `desc`, `date`, `due`, `amount`, `status`, `notes`, `madeUnderSOPAct`, `sopActState`, `supportingDocs[]`.

An invoice record has: `id`, `subId`, `supplier`, `docRef`, `ccId`, `amount`, `status`, `invoiceDate`, `dueDate`, `comments`, `supportingDocs[]`.

PC/PS items: `{id, description, allowance, marginRate, actualCost, status}`.

For the full data-model write-up that becomes the Postgres schema in Phase 5, see Phase 2 in ROADMAP. The schema additions promised in CONTRACTS_REFERENCE.md §10 ("Phase 2") need to land before the backend work.

---

## 9. Getting it running locally

```bash
git clone git@github.com:worksite-studio/sitework.git
cd sitework
python3 serve.py    # http://127.0.0.1:3456
```

That's it. No `npm install`, no build step, no env vars.

To reset to seed data after experimenting: Settings → Reset to Demo Data, OR clear `sw_state_v1` from localStorage.

To inspect state in the browser console: `JSON.parse(localStorage.sw_state_v1)`.

---

## 10. Open questions for the buyer / new developer

These are decisions you should make explicit before quoting:

1. **Port vs rewrite?** Recommended port (see §6). A rewrite throws away the data model and the contracts-reference work.
2. **Test strategy.** The current codebase has zero tests. A first sweep of reducer + financial-calculation tests would catch regressions during the port.
3. **Design system.** Inline styles work for a prototype but a Tailwind or CSS-Modules pass during Phase 4 is the natural extraction point.
4. **CI/CD target.** Vercel is the assumption; CloudFlare Pages / Netlify would also work. Pick before Phase 4 finishes.
5. **PDF library.** Phase 3 needs a choice: `react-pdf` (full layout control) vs browser print CSS (cheaper, less consistent). The Open Book report currently uses browser print as an interim.
6. **Backend / auth provider.** Supabase is the assumed path (Phase 5). Firebase / Hasura / a self-hosted Postgres + Hono backend are all reasonable alternatives — the schema is what matters, not the framework.
