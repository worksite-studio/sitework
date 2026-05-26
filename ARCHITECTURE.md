# ARCHITECTURE.md — SITEWORK technical guide

How the codebase is put together, how it got that way, and what a developer should know before doing the Phase 4 React-scaffold port. Companion to `DATA_MODEL.md` (entity reference), `CLAUDE.md` (codebase pointer), `WORKFLOW.md` (operating procedures), and `CONTRACTS_REFERENCE.md` (legal source-of-truth).

Audience: the developer who will port this codebase to a normal React project; also future sessions navigating the minified file.

---

## 1. What this is

SITEWORK is a construction finance SaaS for Australian builders. The current implementation is a **single HTML file** (`index.html`, ~440KB minified). It contains:

- React 19.2.4 loaded from a CDN (no `npm`, no build step)
- The full application code (minified, JSX pre-transpiled)
- All seed data inline
- CSS-in-JS inline styles

The app runs by serving `index.html` over any static HTTP server (`python3 serve.py` → `http://127.0.0.1:3456`). State persists to `localStorage` under the key `sw_state_v1`.

There is no backend. There is no database. There is no test suite. There is no build pipeline. Everything is in the one file.

This was deliberate at the start (see §2) and is now actively constraining further work. Phase 4 (un-minify + scaffold a real React project) is the next architectural milestone.

---

## 2. Why single-file (the deliberate constraint)

**Started as a prototype.** Single-file HTML with React on a CDN is the fastest possible path to a clickable UI. No `npm install`, no Vite config, no deploy step. You open the file in a browser and the app runs.

**Kept that way through Phases 0 and 1** because the friction of un-minifying / scaffolding always lost to "just ship the next feature." Each session ended with a working app and a slightly bigger `index.html`.

**The cost we're now paying:** every edit is a Python string-replacement on minified JS. A typical edit:

1. Find a unique byte pattern in the minified code
2. `python3 -c "...content.find(...)"` to confirm uniqueness
3. Replace via `content.replace(old, new)`
4. Verify bracket balance stays at `(3, 3, 3)` (CLAUDE.md has the script)
5. If broken: `git checkout -- index.html` and retry

A 2-minute fix in a normal React project (`open BoqRow.tsx`, edit, save, hot-reload) becomes a 20-minute careful surgery here, with real risk of breaking the file. The substantiation rounds in Phase 1.5 (sessions 26–28) showed the limit: three failed fixes in a row on a cost-code dropdown because the same minified `<select>` pattern existed in multiple components and I kept fixing the wrong one.

**Phase 4 fixes this.** Un-minify the file with `prettier --parser babel`, scaffold a Vite + React 19 project (TypeScript optional but recommended), port modules one at a time.

---

## 3. High-level architecture

```
                      ┌─────────────────────┐
                      │   index.html (one)  │
                      └──────────┬──────────┘
                                 │ runs
                                 ▼
                       ┌─────────────────┐
                       │   <Ap> (root)   │
                       └────────┬────────┘
                                │
                ┌───────────────┴────────────────┐
                ▼                                ▼
        ┌──────────────┐                ┌──────────────┐
        │ <Lp> Splash  │ ── click ───►  │ <Pc> Shell   │
        └──────────────┘                └──────┬───────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                   ┌──────────┐         ┌──────────┐         ┌──────────┐
                   │ Sidebar  │         │ TopNav   │         │ View     │
                   │ (project │         │ (section │         │ (current │
                   │  list)   │         │  tabs)   │         │  module) │
                   └──────────┘         └──────────┘         └────┬─────┘
                                                                  │
                                                                  ▼
                              ┌─────────────────────────────────────────────┐
                              │   useReducer(Z1, initialState)              │
                              │   wrapped by Z1Persisted (localStorage)     │
                              └──────────────────────┬──────────────────────┘
                                                     │
                                                     ▼ dispatch({type, …})
                                              state updates
                                              everything re-renders
```

**State flow:** every module receives `{project, dispatch}` (and sometimes more) as props from `<Pc>`. To mutate, the module calls `dispatch({type: "ADD_INVOICE", projectId, invoice})`. The reducer `Z1` produces a new state. The new state is JSON-serialised to localStorage by `Z1Persisted`. React re-renders.

There is no router. There is no global event bus. There is no Redux. There is one `useReducer` and it carries everything.

---

## 4. Rendering styles (two of them — both in active use)

The codebase has two distinct rendering styles, and both ship in production:

### 4.1 `o.jsx` / `o.jsxs` (newer)

Pre-transpiled JSX using the React 19 JSX-runtime. Most components written from session 16 onward use this style.

```js
o.jsx("div", {style: {…}, children: o.jsxs("span", {children: ["text", value]})})
```

Helpers in scope: `A`, `zt`, `Q`, `x`, `Ot` — these are minified utility wrappers (status badges, form helpers, modal builders). When porting to JSX in Phase 4, these expand back to normal JSX trees.

**Used by:** most newer components — `D1v2`, `Y1v2`, `Pcps`, `Calx`, `Obx`, `Bti`, `He`, plus the substantiation file-picker pattern.

### 4.2 `React.createElement` (older)

Verbose pre-JSX style. Most components from sessions 1–15 use this.

```js
React.createElement("div", {style: {…}},
  React.createElement("select", {value: x, onChange: e => …},
    options.map(opt => React.createElement("option", {key: opt.id, value: opt.id}, opt.name))
  )
)
```

**Used by:** `Cl1` (Progress Claims list), `ClaimForm1`, `O1v2` (Invoices list), `InvFormV2`, `M1v2` (POs list), `POFormV2`, `k1v2` (Defects), `w1` (BOQ row editor), `RF1`, `V1` (Subcontractor list).

**Why this matters:** the createElement style is harder to read and harder to safely edit in minified form. Every Phase 1.5 substantiation bug surfaced in `createElement`-style components, never in `o.jsx`-style components. Phase 4 should port the `createElement` components first (they need the most rewriting anyway) and unify everything to JSX.

---

## 5. Component map

Minified names mapped to friendly names, purposes, and rendering style. This is the authoritative navigation index for `index.html`.

### 5.1 Shell & framework

| Minified | Friendly | Purpose | Style |
|---|---|---|---|
| `Ap` | App | Top-level entry; switches between splash and shell | `o.jsx` |
| `Lp` | Splash | Click-to-enter splash screen | `o.jsx` |
| `Pc` | AppShell | Sidebar + topnav + view switcher; holds `useReducer` | `o.jsx` |
| `Z1` | reducer | Root reducer (44 action types) | n/a |
| `Z1Persisted` | persistedReducer | Wraps `Z1` with localStorage write-through | n/a |
| `He` | StatusBadge | Reusable coloured status chip | `o.jsx` |
| `Ft` | formatDate | `Date → "DD MMM YYYY"` | n/a |
| `k` | formatCurrency | `Number → "$ 12,345.67"` | n/a |

### 5.2 Top-level views (in left sidebar)

| Minified | Friendly | Purpose | Style |
|---|---|---|---|
| `Y1v2` | Dashboard | KPI tiles, project pipeline, cash position | `o.jsx` |
| `V1` | SubcontractorList | All subs, expiry chips, certificates | `createElement` |
| `z1` | SubcontractorForm | New / edit sub | `createElement` |
| `L1` | ClientList | All clients | `o.jsx` |
| `m1` | ClientForm | New / edit client | `o.jsx` |
| `G1` | LeadList | Pipeline of leads | `o.jsx` |
| `Cv1` | ConvertLead | Lead → Project + Client modal | `o.jsx` |
| `H1` | EstimatingHub | Estimates + BOQ templates browser | `o.jsx` |
| `Et1` | EstimateFromTemplate | New estimate from template wizard | `o.jsx` |
| `j1v2` | CashFlow | Forecasted vs actual cash position | `o.jsx` |
| `St1` | Settings | Builder business info, integrations | `o.jsx` |
| (top) | MaterialsList | Materials catalogue | `o.jsx` |
| (top) | SuppliersList | Suppliers catalogue | `o.jsx` |

### 5.3 Project-scoped tabs

When a project is selected, the view becomes a tabbed module. Tabs:

| Minified | Friendly | Purpose | Style |
|---|---|---|---|
| `D1` / `D1v2` | ProjectOverview | BOQ table + Contract-vs-Cost panel | `o.jsx` |
| `w1` | BoqRowEditor | Inline editor for a single CC row | `createElement` |
| `p1` | CostCodeForm | New / edit cost code | `o.jsx` |
| `Bti` | BoqTemplateImport | Import codes from a template (1.5-C) | `o.jsx` |
| `Pcps` | PcPsModule | Prime Cost + Provisional Sum tab (1.5-1) | `o.jsx` |
| `B1` | VariationsTab | Variation list + form | `o.jsx` |
| `O1v2` | InvoicesTab | Invoice list | `createElement` |
| `InvFormV2` | InvoiceForm | New / edit invoice (incl. supportingDocs, 1.5-A) | `createElement` |
| `M1v2` | POsTab | Purchase order list | `createElement` |
| `POFormV2` | POForm | New / edit PO | `createElement` |
| `Cl1` | ClaimsTab | Progress claims list | `createElement` |
| `ClaimForm1` | ClaimForm | New / edit claim (incl. supportingDocs, 1.5-A) | `createElement` |
| `k1v2` | DefectsTab | Defects list & rectification tracking | `createElement` |
| (mod) | DiaryTab | Site diary entries | `o.jsx` |
| `RF1` | RfiTab | RFI register | `createElement` |
| (mod) | MilestoneTab | Project milestones | `o.jsx` |
| (mod) | SelectionsTab | Client selections | `o.jsx` |
| (mod) | TimesheetsTab | Builder/staff timesheets | `o.jsx` |
| `Calx` | CalendarTab | Warranty / expiry / milestone calendar (1.5-D) | `o.jsx` |
| `Obx` | OpenBookReport | Owner-facing open-book view (1.5-F) | `o.jsx` |
| `I0` | ProjectForm | New / edit project (incl. Phase 0-H fields) | `o.jsx` |

### 5.4 Design tokens

| Symbol | Purpose |
|---|---|
| `d` | Object literal — colour palette (`d.primary`, `d.bg`, `d.text`, …) |
| `v` | Object literal — font styles (`v.h1`, `v.body`, …) |

These are imported by every component. CSS classes don't exist; everything is inline `style={d.X}` / `style={v.Y}`.

---

## 6. Reducer action catalogue

`Z1` handles 44 distinct actions. Verified by grepping `type:"[A-Z_]+"` across the file (session 29 inventory pass).

### 6.1 Projects

| Action | Payload (other than `type`) | Effect |
|---|---|---|
| `ADD_PROJECT` | `project: Project` | Push to `state.projects[]`; init per-project keyed entries |
| `UPDATE_PROJECT` | `projectId, patch: Partial<Project>` | Merge patch into project record |
| `DUPLICATE_PROJECT` | `projectId, newName` | Deep-clone project + all nested entities |

### 6.2 Cost codes (nested in Project)

| Action | Payload | Effect |
|---|---|---|
| `ADD_CODE` | `projectId, code: CostCode` | Append to `project.codes` |
| `UPDATE_CODE` | `projectId, codeId, patch` | Merge patch into the code |
| `DELETE_CODE` | `projectId, codeId` | Remove from `project.codes` |
| `MOVE_CODE_UP` | `projectId, codeId` | Swap with predecessor |
| `MOVE_CODE_DOWN` | `projectId, codeId` | Swap with successor |
| `IMPORT_TEMPLATE_INTO_BOQ` | `projectId, templateId` | Bulk-add codes from template; dedupe by code string (1.5-C) |

### 6.3 Line items (nested in CostCode)

| Action | Payload | Effect |
|---|---|---|
| `ADD_LINE_ITEM` | `projectId, ccId, lineItem` | Append to the cost code's line items |

### 6.4 Variations

| Action | Payload | Effect |
|---|---|---|
| `ADD_VARIATION` | `projectId, variation` | Append to `project.variations` |
| `UPDATE_VARIATION` | `projectId, voId, patch` | Merge patch |

### 6.5 Invoices

| Action | Payload | Effect |
|---|---|---|
| `ADD_INVOICE` | `projectId, invoice` | Append. Cost-plus: form requires ≥1 `supportingDocs[]` entry (1.5-A) |
| `UPDATE_INVOICE` | `projectId, invId, patch` | Merge patch |

### 6.6 Purchases / POs

| Action | Payload | Effect |
|---|---|---|
| `ADD_PURCHASE` | `projectId, purchase` | Push to `state.purchases[projectId]` |
| `RECEIVE_PURCHASE` | `projectId, poId, receivedDate` | Set `status: "received"` + `receivedDate` |

### 6.7 Claims

| Action | Payload | Effect |
|---|---|---|
| `ADD_CLAIM` | `projectId, claim` | Cost-plus: requires `supportingDocs[]`. Auto-fills `claimNo` (session 28) |
| `UPDATE_CLAIM` | `projectId, clmId, patch` | Merge patch |

### 6.8 PC / PS items (1.5-1)

| Action | Payload | Effect |
|---|---|---|
| `ADD_PC_ITEM` | `projectId, item` | Append to `state.primeCostItems[projectId]` |
| `UPDATE_PC_ITEM` | `projectId, pcId, patch` | Merge patch |
| `DELETE_PC_ITEM` | `projectId, pcId` | Remove |
| `ADD_PS_ITEM` | `projectId, item` | `state.provisionalSums[projectId]` |
| `UPDATE_PS_ITEM` | `projectId, psId, patch` | Merge patch |
| `DELETE_PS_ITEM` | `projectId, psId` | Remove |

### 6.9 Retention

| Action | Payload | Effect |
|---|---|---|
| `UPDATE_RETENTION` | `projectId, patch: {rate?, held?, released?}` | Merge into `state.retention[projectId]` |

### 6.10 Diary / Defects / Selections / Timesheets

| Action | Payload | Effect |
|---|---|---|
| `ADD_DIARY_ENTRY` | `projectId, entry` | Append to `state.diary[projectId]` |
| `ADD_DEFECT` | `projectId, defect` | Append |
| `UPDATE_DEFECT` | `projectId, defId, patch` | Merge patch |
| `ADD_SELECTION` | `projectId, selection` | Append |
| `APPROVE_SELECTION` | `projectId, selId, approvedOption` | Set status + option |
| `ADD_TIMESHEET` | `projectId, timesheet` | Append |
| `DELETE_TIMESHEET` | `projectId, tsId` | Remove |

### 6.11 Subs / Clients / Leads

| Action | Payload | Effect |
|---|---|---|
| `ADD_SUB` | `sub` | Append to top-level `state.subs` |
| `UPDATE_SUB` | `subId, patch` | Merge patch (includes `certificates[]` updates for 1.5-E) |
| `ADD_CLIENT` | `client` | Append to `state.clients` |
| `UPDATE_CLIENT` | `clientId, patch` | Merge patch |
| `ADD_LEAD` | `lead` | Append to `state.leads` |
| `UPDATE_LEAD` | `leadId, patch` | Merge patch |
| `CONVERT_LEAD_TO_PROJECT` | `leadId, project, client?` | Creates Project + Client + marks lead `won` |

### 6.12 Estimates

| Action | Payload | Effect |
|---|---|---|
| `ADD_ESTIMATE` | `estimate` | Append to `state.estimates` |
| `UPDATE_ESTIMATE` | `estId, patch` | Merge patch |
| `ADD_EST_CODE` | `estId, code` | Append to estimate's codes |
| `CREATE_ESTIMATE_FROM_TEMPLATE` | `templateId, name, contractValue` | New estimate with template codes (budgets from `pct`) |
| `PROMOTE_ESTIMATE` | `estId, projectName` | Create `PRJ-` from estimate, copying codes |

### 6.13 Missing actions

The following entities exist but have no `ACTION` with a matching name string:

- **Milestone** (entity present, 13 in seed) — mutations probably happen via `UPDATE_PROJECT` or a different action wrapper.
- **RFI** (3 in seed) — same situation.
- **Material** / **Supplier** — top-level catalogue tables, no add/update actions found in inventory.
- **Settings** — no `UPDATE_SETTINGS` found.

Phase 4 should introduce explicit `ADD_/UPDATE_` actions for each of these and audit existing UI to find where they currently mutate.

---

## 7. State shape (top level)

See `DATA_MODEL.md §5` for the canonical reference. Summary:

```js
{
  // top-level arrays
  projects: [Project],   clients: [Client],  subs: [Subcontractor],
  leads: [Lead],         estimates: [Estimate],
  materials: [Material], suppliers: [Supplier], templates: [BoqTemplate],

  // per-project keyed
  milestones: {[id]: [Milestone]},
  diary:      {[id]: [DiaryEntry]},
  timesheets: {[id]: [Timesheet]},
  defects:    {[id]: [Defect]},
  selections: {[id]: [Selection]},
  claims:     {[id]: [ProgressClaim]},
  purchases:  {[id]: [Purchase]},
  primeCostItems: {[id]: [PrimeCostItem]},
  provisionalSums:{[id]: [ProvisionalSum]},
  rfis:       {[id]: [RFI]},
  retention:  {[id]: {rate, held, released}},

  // single record
  settings: { … }
}
```

`Project` itself nests `codes[]`, `variations[]`, `invoices[]`, and a `{ccId: [LineItem]}` map.

---

## 8. localStorage persistence

`Z1Persisted` is a thin wrapper around `useReducer(Z1, …)`:

1. On mount, read `localStorage.getItem("sw_state_v1")`. If present, JSON-parse it; otherwise fall back to seed.
2. **Lazy initializer merges stored state into seed defaults** — for every top-level key in seed, if it's missing in stored state, copy the seed default in. This is forward-compatible: adding a new top-level collection (e.g., `templates[]` in 1.5-C) doesn't break stored saves from earlier sessions.
3. After every dispatch, JSON-serialise the new state and `localStorage.setItem("sw_state_v1", …)`.

**The versioning convention:** `sw_state_v1` is the current key. When a state migration is needed that *can't* be handled by the lazy initializer (renaming fields, restructuring relationships), increment to `sw_state_v2` and write a one-time migration function that reads from `_v1`, transforms, and writes to `_v2`. Then delete the `_v1` read after one release cycle.

**Storage limit:** localStorage is ~5MB per origin. Phase 1.5-A and 1.5-E both write base64 dataURLs into state (file attachments). With a few PDFs per project, this fills fast. Phase 5 must move file storage to an object store and store only references.

---

## 9. Routing & navigation

There is no router. State held in `Pc`:

- `view` — currently active top-level section (e.g. `"dashboard"`, `"projects"`, `"subs"`, `"settings"`)
- `selectedProjectId` — when viewing a project, which one
- `projectTab` — when viewing a project, which tab (e.g. `"boq"`, `"claims"`, `"calendar"`)

Switching views = `setView("subs")`. Switching projects = `setSelectedProjectId("PRJ-002")` + `setView("project")`. Each module is conditionally rendered based on these.

**Top-level views:** Dashboard, Projects, Subcontractors, Clients, Leads, Estimating, Materials, Suppliers, Cash Flow, Settings.

**Per-project tabs:** Overview, BOQ, PC & PS, Variations, Invoices, POs, Claims, Defects, Diary, RFIs, Milestones, Selections, Timesheets, Calendar, Open Book.

No URL routing means the back button doesn't work as expected (browser back leaves the app), and deep-linking is impossible. Phase 4 should add React Router or TanStack Router.

---

## 10. Design tokens & styling

CSS-in-JS inline styles. No CSS classes, no theme provider, no responsive breakpoints.

- **Colours** live in object `d` — `d.primary`, `d.text`, `d.muted`, `d.bg`, `d.surface`, `d.danger`, `d.warning`, `d.success`, plus tints.
- **Fonts** live in object `v` — `v.h1`, `v.h2`, `v.body`, `v.small`, etc. Each is a style object: `{fontSize, fontWeight, lineHeight, …}`.
- **Currency formatting** via `k(number)` — returns `"$ 12,345.67"`.
- **Date formatting** via `Ft(date)` — returns `"24 May 2026"`.
- **Status badges** via `<He status="paid">` — coloured chip with `d.success` etc.

Everything is desktop-first. There are no media queries. Mobile usability has not been a goal.

**Phase 4 should:** move to Tailwind (matches the utility-first inline-style pattern) or CSS Modules. Replace `d` with CSS custom properties on `:root`. Replace `v` with Tailwind classes or a typography component. Add responsive breakpoints.

---

## 11. File-upload pattern

Phase 1.5-A introduced a file-picker that stores attachments as base64 dataURLs directly in state. Used by:

- Invoice substantiation (`InvFormV2.supportingDocs[]`)
- Progress claim substantiation (`ClaimForm1.supportingDocs[]`)
- Subcontractor insurance certificates (`SubForm.certificates[]`, 1.5-E)

Shape per file: `{name: string, dataUrl: string, size: number}`.

**This is a prototype shortcut.** It works for ~5 small PDFs total before localStorage fills. Phase 5 must:

1. Move file storage to S3 / Supabase Storage / similar.
2. Replace `dataUrl` with a signed-URL reference.
3. Add upload progress / failure handling.
4. Keep `name` and `size` as denormalised metadata for fast list rendering.

---

## 12. Design decisions and tradeoffs

| Decision | Rationale | Cost we're paying |
|---|---|---|
| Single HTML file | Zero toolchain to start; immediate browser preview | Edits are string-replace surgery on minified JS |
| Minified JS | Saves bandwidth, ships as a single artefact | Almost-uneditable by hand; every bug fix is fragile |
| Two render styles (`o.jsx` + `createElement`) | `createElement` is legacy from sessions 1–15; `o.jsx` is current | Inconsistency increases cognitive load; bugs cluster in `createElement` |
| localStorage only | No backend needed for a single-user prototype | No multi-user, no audit trail, no backups, no concurrent edit handling — Phase 5 fixes |
| Inline styles via `d` / `v` | Fast prototyping, no CSS pipeline | No theming, no responsive, no design system — Phase 4 migrates |
| No test suite | Browser smoke tests sufficed for early phases | Regressions hit production; substantiation rounds in 1.5 are a direct cost — Phase 4 must add tests |
| No router | Two state booleans replaced a router; faster to ship | No deep links, broken back button — Phase 4 fixes |
| No types | JSDoc and seed-data inference instead of TypeScript | Refactors are blind; field renames break silently — Phase 4 adopt TS |
| File attachments as dataURLs in state | Single-file constraint forced it | localStorage fills fast — Phase 5 moves to object storage |
| Per-project-keyed dictionaries (e.g. `claims[projectId]`) | Direct lookups without a DB join | Cross-project iteration is awkward — Phase 5 normalises to FK columns |

---

## 13. Known issues / tech debt

In rough priority order for whoever takes this forward:

1. **Single-file constraint.** The root cause of most other items on this list. Un-minifying is Phase 4's first step.
2. **Minified.** Even before un-minifying, this makes review hard. `prettier --parser babel` should beautify the current file in seconds.
3. **No types.** TS adoption in the Phase 4 scaffold catches the entity-field-mismatch bugs that bit Phase 1.5-A.
4. **No test suite.** Add Vitest + React Testing Library for unit/integration; Playwright for end-to-end smoke tests of the critical flows (substantiation, claim numbering, BOQ template import).
5. **No error boundaries.** A runtime error in any module crashes the whole app. Add a top-level error boundary and per-module boundaries in Phase 4.
6. **`localStorage` is the only persistence.** No multi-user, no audit, no backups. Phase 5.
7. **File-as-dataURL storage.** ~5MB ceiling. Phase 5.
8. **No router.** Phase 4.
9. **Two render styles.** Unify on JSX during Phase 4 port.
10. **Missing reducer actions.** Milestones, RFIs, Materials, Suppliers, Settings have entities but no dedicated `ADD_/UPDATE_` actions in the inventory. Phase 4 should add them.
11. **String FKs in places.** `Invoice.supplier`, `Purchase.supplier` are names, not IDs. Phase 5 normalisation.
12. **Inconsistent enum casing.** `contractType` uses kebab-case in seed (`"cost-plus"`) but `§10` schema uses PascalCase (`"CostPlus"`). Standardise in Phase 5.
13. **`subs[].projects[]` denormalised array.** Becomes a join table in Phase 5.
14. **Substantiation Cost-Code dropdown empty-state.** Retrofitted across `InvFormV2` and `POFormV2` in 1.5; verify it's also right in `w1` (BOQ row editor).
15. **Sidebar nav doesn't reset on project deletion.** Old session 19 fix; check it still holds.
16. **No CI.** Add GitHub Actions in Phase 4 to run tests + a build check on every PR.

---

## 14. Recommended Phase 4 first-week plan

Assumes the developer has React + TypeScript familiarity but no prior context on SITEWORK.

**Day 1 — un-minify and orient.**
- `prettier --parser babel --write index.html` (or extract the inline `<script>` first, then format)
- Read `WORKFLOW.md`, `CLAUDE.md`, `HANDOFF.md`, this file, `DATA_MODEL.md`, `CONTRACTS_REFERENCE.md`
- Click through the running app on `python3 serve.py`. Try every tab on each of the 4 seed projects.

**Day 2 — scaffold the new project.**
- `npm create vite@latest sitework-react -- --template react-ts`
- Install React 19, set up Tailwind (or CSS Modules), shadcn/ui (or Mantine) for primitives
- Set up Vitest + Playwright
- Set up React Router or TanStack Router
- Copy `d` and `v` design tokens into CSS variables / Tailwind config
- Port leaf components first: `He` (StatusBadge), `k` (formatCurrency), `Ft` (formatDate) → typed utilities + a `<Badge>` component

**Day 3-4 — port modules in dependency order.**
- TypeScript types for every entity (DATA_MODEL.md is the source)
- The reducer (`Z1`) with full unit tests for every action
- One simple module end-to-end (`L1` Clients is a good first target — small, isolated, `o.jsx` style)
- Verify parity: same UI, same behaviour, no console errors

**Day 5 — port the bigger modules.**
- Project Overview (`D1v2`) including BOQ table and Contract-vs-Cost panel
- One `createElement`-style module (`Cl1` Claims, including `ClaimForm1` with substantiation) — this is the hardest target because of the substantiation logic and the cost-plus gating; getting it right early validates the porting approach

**Week 2 — keep going module by module.** Aim for parity against the current `index.html` per module. Don't bundle features and ports — that mixes "is this a port bug or a new bug" diagnosis.

**Throughout:** keep the current `index.html` running on `:3456` and the new app on `:5173`. Click-through comparison between the two is the most reliable parity check there is.

---

## 15. Pointers to other docs

| Doc | Covers |
|---|---|
| `CLAUDE.md` | Quick orientation for Claude sessions; key minified names; bracket-balance script |
| `DATA_MODEL.md` | Every entity's fields, FKs, Phase 5 target additions |
| `CONTRACTS_REFERENCE.md` | Australian construction contract law → app feature implications. **Source of truth for compliance behaviour.** |
| `WORKFLOW.md` | Operating procedures: branching, committing, smoke-testing, ROADMAP discipline |
| `HANDOFF.md` | Plain-English overview for vendor evaluation; tech debt summary |
| `ROADMAP.md` | Phase tracker + session log |
| `VENDOR_BRIEF.md` (private, in `~/Documents/sitework/reference/`) | Personal notes for evaluating vendor proposals |

---

*Last updated: 2026-05-24, session 29. Component map, reducer action catalogue, and rendering-style assignments verified against `index.html` at commit `1b57bf4` (Phase 2 docs branch).*
