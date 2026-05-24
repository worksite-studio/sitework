# SITEWORK — Construction Finance
## Product Roadmap

> **Working principle:** Each session has a defined scope. Nothing gets added mid-session unless it's a blocker.
> All changes are committed and pushed to GitHub Pages at the end of every session.
> We are building the entire platform — no external developer handoff. Code stays clean and well-documented so it scales with us.

---

## Status Key
- ✅ Done
- 🔄 In progress / partially done
- ⬜ Not started
- 🚫 Blocked (depends on another item)

---

## Phase 0 — UI/UX Polish & Module Audit
*Goal: Every module works correctly, displays real data consistently, and handles edge cases before new features are added.*

### 0-A: Completed this far ✅
- ✅ Navigation: Progress Claims before Invoices, Defects tab (was Retention & FFC), BOQ Templates removed from sidebar, Settings added
- ✅ Branding: JW → WS avatar, Jake Walsh → Worksite, greeting updated
- ✅ Dashboard: Portfolio Margin KPI, Budget & Margin panel, clickable project rows, compliance bar moved out
- ✅ Variations: Requested By field added to form and initial state
- ✅ Invoices: Comments column header added
- ✅ Clients: expandable rows showing contact detail
- ✅ Settings module: business name, default contract type, margin %, GST toggle (localStorage)
- ✅ Seed data: `contractType` field on all projects

---

### 0-B: Quick Fixes ✅
- ✅ **Variations table row**: Requested By column header + cell rendering correctly
- ✅ **Invoices form**: Comments textarea added before Save button
- ✅ **Client Selections (N1)**: "Category" label renamed to "Cost Code"
- ✅ **WS avatar**: clickable, navigates to Settings module
- ✅ **BOQ Templates**: Estimates / BOQ Templates tab bar inside H1 Estimating module — 6 templates, "Use Template" modal (Et1), CREATE_ESTIMATE_FROM_TEMPLATE reducer action

---

### 0-C: Dashboard & Project Overview Audit ✅

- ✅ **Project Overview KPIs**: Contract Value, Cost to Date, Margin Erosion all accurate. D1 shows base CV + target margin; D1v2 shows adj. CV (incl. variations) + live margin vs target. "Cost to Complete" label fixed → "Cost to Date"
- ✅ **Dashboard clickthrough**: clicking project health rows navigates correctly to project overview
- ✅ **Contract type display**: COST PLUS / FIXED PRICE badge added to project overview header (D1 component)
- ✅ **BOQ & Budget**: cost codes show correct adj. budget vs actual, variation overlay working, OVER/ON BUDGET status correct
- ✅ **Margin calculation**: Dashboard 16% (portfolio, base CV), D1 "target X% margin", D1v2 live current margin — all correct and clearly labelled

---

### 0-D: Financial Workflow Audit ✅

- ✅ **Variations full flow**: added row-click edit modal to B1 — status changes (Pending → Approved/Rejected) now work; approved amount rolls into contract value via D1v2 (tested: +$1,200 var raised CV from $352,279 → $353,479)
- ✅ **Invoices approval flow**: O1v2 row-click → edit form (InvFormV2) with Pending/Approved/Paid dropdown → UPDATE_INVOICE; dashboard Outstanding Invoices updates live
- ✅ **Purchase Orders flow**: added "Receive" button to M1v2 rows with ORDERED status → dispatches RECEIVE_PURCHASE; header "received of committed" updates immediately
- ✅ **Cross-module data flow**: D1v2 "Cost to Date" correctly combines invoices (not Rejected) + POs (not cancelled); both tabs feed same committed figure
- ✅ **GST handling**: Amount (ex GST) / GST / Total inc GST columns consistent across Invoices and POs; live GST preview in InvFormV2 edit modal

---

### 0-E: Progress Claims & Retention ✅

- ✅ **Progress Claims**: row-click edit modal (pre-fills all fields), status changes (Pending → Approved/Paid) update Outstanding KPI live; UPDATE_CLAIM reducer added
- ✅ **Retention deduction**: Retention column added (−5% of claim amount, rate from retention seed data); Net Certified column added (amount × (1−rate%) × 1.1 incl GST)
- ✅ **Defects module**: 3 seed items display correctly — Open/Rectified statuses, Edit buttons on each row, rectified date shown
- ✅ **Cash flow**: confirmed j1v2 tracks outflow (approved invoices + POs due); Progress Claims are client income — correctly excluded from outflow view (noted as future income-side enhancement)

---

### 0-F: Operations Modules Audit ✅

- ✅ **Site Diary**: 5 entries display correctly — date, weather, worker count + hours, sub tags, notes; + Add Entry form opens with all fields including sub toggles and incident checkbox
- ✅ **Schedule / Milestones**: 7 milestones, 5/7 complete count accurate, COMPLETE/IN PROGRESS/UPCOMING status dots, Edit buttons, progress bar correct
- ✅ **Subcontractors**: 6 registered, 5 compliance issues flagged; Current/Expiring/EXPIRED/Required statuses correct; trade filter tabs work; note — no row edit flow yet (added to 0-G)
- ✅ **Timesheets**: 3 entries, hours × rate totals correct ($760+$570+$675=$2,005), cost codes linked, delete (×) buttons present
- ✅ **RFIs**: 3 RFIs, 1 overdue correctly highlighted (row + Required By date in red), OPEN/CLOSED statuses, responded date shows "—" for open items

---

### 0-G: Supporting Modules & Global UX ✅

- ✅ **Subcontractors edit flow**: row-click edit modal (V1 + z1 + UPDATE_SUB action; mirrors B1/O1v2 pattern, session 13)
- ✅ **Leads Pipeline**: stage progression + value tracking already in place; convert-to-project flow added (CONVERT_LEAD_TO_PROJECT reducer, Cv1 modal with client picker, button + green status indicator in G1 detail view); session 16
- ✅ **Estimating** (post-merge with BOQ Templates): templates → estimate → project flow verified end-to-end; Edit button added to detail panel (UPDATE_ESTIMATE wired via h1 form with `initial` prop); session 15
- ✅ **Clients**: row-click edit added (UPDATE_CLIENT wired via m1 form); projects link correctly, no orphaned clientIds; contact detail complete (session 14)
- ✅ **Help & Education**: 4-tab structure (Start / Modules / Glossary / Rawlinson), 3 getting-started guides, 6 module guides with pro-tips, 14-term glossary of Australian construction finance terms — all real content, not placeholder; content quality verified session 17. Note: help text references Xero + Rawlinson features which aren't live yet (Phases 6/7) — future content pass when those land.
- ✅ **Empty states**: added to Clients (L1), Leads (G1 zero-total case), Estimating (H1 estimates tab); polished Invoices copy. Cl1/k1v2/RF1 (Progress Claims, Defects, RFI Register) still missing — use React.createElement style and need separate treatment, flagged as follow-up (session 18)
- ✅ **Form validation**: all 15 o.jsx forms now red-line empty required fields on save attempt (extended A + zt helpers with `error` prop, per-form `att` state, `?:` save handler). Plus fixed pre-existing PO crash (M1v2 dispatch key mismatch) and tightened Site Diary's loose `date`-only validation. POFormV2 and Cl1/k1v2/RF1 use createElement style — minimal guards added where needed; full red-border conversion deferred to spawned task. Session 19
- ✅ **Typography & spacing**: design tokens added (v.h1/v.h2/v.caption typography; d.bgSubtle/posBg/negBg/warnBg/accentBg/lilacBg backgrounds). Targeted sweep: 8 page-title headings standardised to fontSize:26; 10 inline hex backgrounds converted to token references. Spacing scale deferred to Phase 4. Session 21

---

### 0-H: Statutory Compliance Foundations ✅
*Goal: Add the per-project compliance fields and state-aware validation that the Australian construction contract regime requires. See `CONTRACTS_REFERENCE.md` §10 ("Now") for the source.*

- ✅ **Project fields**: `state`, `contractForm`, `contractClassification`, `estimatedValue`, `isRenovationWithUnknownCost`, `qldHwsAcknowledged` added to project record (seed PRJ-001..004 backfilled + propagated through ADD_PROJECT / PROMOTE_ESTIMATE / CONVERT_LEAD_TO_PROJECT). Plus `contractType` exposed in I0 form (was missing!)
- ✅ **State-aware validation at project creation**: VIC s.13 hard-block with inline red banner + greyed Save (cost-plus, <$1M, not renovation); QLD QBCC HWS acknowledgement checkbox (cost-plus); WA flag stored (s.14 contract title injection deferred to Phase 3 PDF); deposit cap helper text below state select
- ✅ **Progress claim fields**: `madeUnderSOPAct` + `sopActState` added to ClaimForm1 + 5 seed claims. (Invoices excluded — those are received from subs, not issued under SOPA)
- ✅ **Variation fields**: `reasonCategory` (now 6 values inc. Other), `timeImpactDays`, plus consecutive editable ID, Requested By dropdown (Owner/Builder/Architect/Other), conditional comment fields when "Other" picked
- ✅ **Settings**: home state, ABN, 8 state-keyed licence inputs, 5 insurance registration inputs (HBCF/DBI/VBA/QBCC/HII). Fixed latent focus-loss bug (extracted `m` section helper to module scope as `stSec`). Session 23

---

## Phase 1 — LocalStorage Persistence ✅
*Goal: Data survives browser refresh. Required before any real user testing.*

- ✅ Wrapped `Z1` reducer via `Z1Persisted` higher-order reducer that persists full state to `sw_state_v1` on every dispatch (versioned key so future schema changes can migrate)
- ✅ Lazy initializer in `Pc`'s useReducer reads `sw_state_v1` on mount; try/catch falls back to seed if missing or corrupted JSON
- ✅ First-run graceful — empty localStorage → seed
- ✅ "Reset to Demo Data" button in Settings (red outlined, confirm dialog) — removes `sw_state_v1` + `window.location.reload()`
- ✅ Smoke-tested: project/variation/invoice/milestone all persist across refresh; Settings business name now propagates to header + dashboard greeting; Settings Save now reloads to keep all reads consistent
- ✅ Fixed 3 latent bugs surfaced by persistence: I0 edit-wipes-data (codes/lineItems/variations/invoices), hardcoded "Worksite" in header + greeting, depositCapText + insurance grid missing TAS/ACT/NT (session 24)

---

## Phase 1.5 — Compliance Workflows
*Goal: Ship the cost-plus-administration features that build on the 0-H foundations. See `CONTRACTS_REFERENCE.md` §10 ("Phase 1.5") for the source.*
*Estimated: 2–3 sessions*

- ✅ **PC items and PS items as first-class entities** — `primeCostItems` + `provisionalSums` keyed by projectId; new "PC & PS" project tab with Pcps module (two tables, live variance/margin-on-excess/net-to-claim columns, section totals); `pcf` + `psf` forms with validation; 6 reducer cases (ADD/UPDATE/DELETE × PC/PS); seed data for all 4 projects (session 27)
- ✅ **Cost-plus invoice substantiation enforcement** — file picker on InvFormV2 / POFormV2 / ClaimForm1; save blocked on cost-plus projects without an attached supporting doc. Includes follow-up smoke-test fixes: removed `disabled` attr from CC selects (placeholder reachable), ClaimForm1 state init carries `claimNo` so new claims are numbered, Cl1 edit-modal + list cell positional fallback for pre-fix claims (session 28)
- ✅ **Project Calendar tab** — new Calx tab on every project aggregates dated events (milestones, defects logged, subcontractor PL/WC expiries, attached certificate expiries) into a chronological month-grouped list with EXPIRED / ≤30d expiry chips (session 28). Per-state statutory warranty period mapping deferred to a future pass.
- ✅ **Insurance certificate attachments** — `certificates[]` field on every subcontractor with a typed file picker (Public Liability / Workers Comp / PI / SWMS / Other), expiry date and chipped UI in the z1 form. Surfaces on the Calendar tab. Builder-side HBCF/VBA/QBCC settings already shipped in 0-H (session 28).
- ✅ **Owner-facing open-book report** — new "Open Book" tab on every project renders a read-only summary (header + contract & cost summary + variations + progress claims + invoices + PC/PS + retention) with a Print/Save PDF button. Suitable for share/screenshot/print to PDF. URL token surface deferred to Phase 5 backend (session 28).

### Phase 1.5 follow-ups (in scope of closeout)

- ✅ **BOQ cost-code form upgrade** — auto-numbered Code field + 43-category standard dropdown on the "+ Cost Code" form (fixes user-reported "BOQ > CC > No drop down or selection"). Session 28.
- ✅ **BOQ template import** — new "Import Template" button on the BOQ tab pulls codes from any of the 6 BOQ templates into the project's BOQ; dedupes by code; cross-template merges. Session 28.

---

## Phase 2 — Architecture Documentation ✅
*Goal: The codebase is fully mapped and understood before we migrate to a proper scaffold. This is for us — so future sessions move faster and the React migration in Phase 4 is clean.*
*Estimated: 1 session — actual: session 29 (~3 hours including inventory pass + cross-check).*

- ✅ **ARCHITECTURE.md**: comprehensive — what this is, why single-file, ASCII architecture diagram, two rendering styles (o.jsx vs createElement) with which components use each, full component map (36 entries), reducer action catalogue (44 actions grouped by domain), state shape, localStorage persistence + sw_state_v1 versioning, routing-by-useState, design tokens, file-upload dataURL pattern, design decisions + tradeoffs table, 16 known tech-debt items prioritised, recommended Phase 4 first-week porting plan.
- ✅ **DATA_MODEL.md**: every entity (26 documented) with current + Phase 5 target fields. Identifier convention, state organisation explainer (3 storage patterns), entity reference with relationships + recent-addition phase tags, ASCII ERD for Phase 5 target schema, localStorage shape under sw_state_v1. Schema additions from CONTRACTS_REFERENCE.md §10 cited inline as `target — not yet in app`.
- ⏭ **Inline comments** — *skipped by design* (per scope decision): Phase 4 un-minify obsoletes them; ARCHITECTURE.md covers navigation. Will revisit after un-minify.
- ✅ **Seed data review**: 4 targeted additions — (a) PRJ-005 "Hilltop Renovation" fixed-price VIC project with 7 cost codes, (b) SUB-001 certificates[] covering current/amber/expired states, (c) 3 edge-case progress claims on PRJ-001 (zero-amount, retention-released, GST-only), (d) PC-001 + PS-001 marked Reconciled with actualCost > allowance to exercise margin-on-excess.
- ✅ Commit all docs to repo (commits `1b57bf4`, `63ca0c5`, `6f72fb8`)
- ✅ Cross-check verification: 44/44 documented actions present in code; 36/36 documented components present; bracket balance `(3, 3, 3)` after every edit; app loads with no console errors and PRJ-005 renders as FIXED PRICE.

---

## Phase 3 — PDF & Print Export
*Goal: Print-ready documents for client-facing use.*
*Estimated: 1–2 sessions*

- ⬜ Print CSS stylesheet (hide nav, A4 format)
- ⬜ Progress Claim PDF — claim schedule, certified amounts, retention line
- ⬜ BOQ Export — cost codes, budget vs actual, variance
- ⬜ Retention / FFC Certificate
- ⬜ Invoice / Tax Invoice

---

## Phase 4 — Scaffold Proper React Project
*Goal: Move from single HTML file to a clean, scalable codebase we can build the full product on.*
*Estimated: 2 sessions — plan carefully before starting, this is a one-way door*

- ⬜ Vite + React + TypeScript scaffold
- ⬜ Extract each module into its own file (`/src/modules/Dashboard.tsx`, etc.)
- ⬜ Extract design tokens and shared components (`/src/design/`)
- ⬜ Extract reducer and state types (`/src/state/`)
- ⬜ Set up ESLint + Prettier
- ⬜ CI/CD pipeline (GitHub Actions → auto-deploy to Vercel on every push)
- ⬜ All existing functionality verified in new scaffold before retiring HTML file

> **Rule:** Do not start Phase 4 without ARCHITECTURE.md from Phase 2 complete. That document is the migration blueprint.

---

## Phase 5 — Backend, Auth & Multi-user
*Goal: Data lives server-side. Multiple builders can sign up, log in, and see only their own data.*
*Estimated: 3–4 sessions*
*You will need to: create a free Supabase account and paste the project URL + anon key when prompted.*

- ⬜ Set up Supabase project (you create the account, we wire it up)
- ⬜ Schema design — DATA_MODEL.md becomes the PostgreSQL table structure
- ⬜ Authentication — email/password + Google OAuth
- ⬜ Row-level security — each builder firm sees only their own data
- ⬜ Supabase client SDK wired into frontend
- ⬜ Migrate all state from localStorage → Supabase
- ⬜ Organisation / workspace model (one builder firm = one workspace, multiple users per org)
- ⬜ **Immutable audit log** — every change to contract / variation / invoice / PC-PS reconciliation timestamped with user, before/after state. Soft-delete only, no hard deletes. Drives the 10-year record-keeping horizon required by NSW DBP Act and equivalent state regimes (see `CONTRACTS_REFERENCE.md` §7.7)
- ⬜ **Owner portal** — read-only mirror of the cost-plus open-book report (every cost, linked receipts, PC/PS reconciliation) and variation history with signatures. Separate from builder portal; row-level security
- ⬜ **State threshold tables** — `StatutoryRules` keyed by `(state, effectiveDate)` so deposit caps, mandatory clause sets, retention defaults and warranty periods can be updated without code changes. Project compliance is checked against the rules in force at contract signing, not against the current rules

---

## Phase 6 — Xero Integration
*Goal: Approved invoices and POs sync to Xero automatically.*
*Estimated: 1–2 sessions (requires Phase 5 backend)*

- ⬜ OAuth 2.0 flow (requires backend for token storage)
- ⬜ Map Xero contacts → SITEWORK subcontractors/clients
- ⬜ Push approved invoices to Xero as bills
- ⬜ Pull payment status back from Xero → update invoice status
- ⬜ Map Xero chart of accounts to cost code categories

---

## Phase 7 — Rawlinson Rate Lookup
*Goal: Benchmark cost data in BOQ and Estimating.*
*Estimated: 1 session*

- ⬜ Rawlinson API or static dataset (confirm licensing)
- ⬜ Rate lookup in line item / BOQ form
- ⬜ Regional multipliers (NSW, VIC, QLD, WA, etc.)

---

## Phase 8 — Billing & Go-Live
*Goal: Paying subscribers, smooth onboarding, production-grade infrastructure.*
*Estimated: 2–3 sessions*
*You will need to: create a Stripe account and provide API keys. Terms of service and privacy policy require legal review (Australian law) — we can draft them but recommend a lawyer signs off.*

- ⬜ Stripe — subscription tiers (Solo Builder / Small Team / Enterprise)
- ⬜ Onboarding flow — first project setup wizard
- ⬜ Trial period logic (14-day free trial, no credit card required)
- ⬜ Terms of service + privacy policy drafts
- ⬜ Production domain, SSL, error monitoring (Sentry)
- ⬜ Support documentation / help centre

---

## Tech Stack (target)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite | Standard, contractor-friendly |
| Styling | Tailwind or CSS Modules | Replace inline styles at Phase 4 |
| Backend | Supabase | Auth + DB + API, minimal ops overhead |
| Hosting | Vercel (frontend) + Supabase (backend) | Free tiers, scale well |
| Payments | Stripe | Industry standard |
| PDF | react-pdf or print CSS | Decide at Phase 3 |
| Xero | Xero API v2 | Official API |

---

## Session Log

| Session | Date | Phase | What was done |
|---|---|---|---|
| 1 | 2026-04-28 | 0-A | Initial build in Claude Chat — all modules scaffolded |
| 2 | 2026-04-28 | 0-A | Migrated to Claude Code CLI, GitHub Pages deploy |
| 3 | 2026-04-29 | 0-A | Nav, branding, routing fixes; BOQ committed cost fix |
| 4 | 2026-04-30 | 0-A | Dashboard overhaul, Settings module, expandable Clients |
| 5 | 2026-05-02 | 0-B | Variations row, invoice comments, selections label, WS avatar nav |
| 6 | 2026-05-02 | 0-B | BOQ Templates tab inside Estimating — 6 templates, Use Template modal, reducer action |
| 7 | 2026-05-02 | 0-C | Dashboard & Project Overview audit — KPIs verified, contract type badge added, Cost to Date label, target margin label |
| ... | — | ... | ... |

---

| 8 | 2026-05-03 | 0-D | Financial workflow audit — variation edit modal, PO receive button, invoice flow verified, GST labels confirmed |
| 9 | 2026-05-03 | 0-E | Progress Claims & Retention — retention/net certified columns, row-click edit modal, UPDATE_CLAIM reducer, defects audit, cash flow scope confirmed |
| 10 | 2026-05-03 | 0-F | Operations modules audit — Site Diary, Schedule, Subcontractors, Timesheets, RFIs all verified; subs edit flow noted for 0-G |
| 11 | 2026-05-07 | docs | WORKFLOW.md added — operating manual covering repo map, session loop, branch+PR workflow, logging, loose-files cleanup; first dry run of feature-branch + PR loop |
| 12 | 2026-05-08 | chore | PAT rotated — new ed25519 SSH key, remote swapped to SSH, old PAT revoked; WORKFLOW.md §7/§10 updated to reflect new auth state |
| 13 | 2026-05-11 | 0-G | Subcontractors row-click edit modal — UPDATE_SUB reducer action, z1 form accepts `initial` prop, V1 row onClick → edit modal; mirrors B1/O1v2 pattern; smoke-tested locally |
| 14 | 2026-05-11 | 0-G | Clients edit flow — Edit Client button in expanded detail row dispatches UPDATE_CLIENT via existing m1 form; verified 4 projects → 3 clients link with no orphans |
| 15 | 2026-05-11 | 0-G | Estimating edit modal — UPDATE_ESTIMATE reducer + h1 form `initial` prop + Edit button in H1 detail panel; one mid-session bug (modal render in wrong scope) caught and fixed in same PR via 3 commits (squashed at merge) |
| 16 | 2026-05-11 | 0-G | Leads Convert-to-Project flow — CONVERT_LEAD_TO_PROJECT reducer (creates fresh project, marks lead won + stores convertedToProjectId ref), new Cv1 modal with client picker, button + green status indicator in G1 detail; one state-vs-setter bug fixed mid-session; spawned task for "sidebar nav doesn't reset module detail view" papercut |
| 17 | 2026-05-16 | 0-G | Help & Education content quality verified — 4 tabs + seeded content all real, no placeholders; ticked without code change. Forward refs to Xero/Rawlinson noted for future pass when those phases land |
| 18 | 2026-05-16 | 0-G | Empty states pass — added to Clients, Leads (zero-total banner), Estimating (estimates tab); Invoices copy polished. 3 modules (Cl1, k1v2, RF1) still need empty states but use createElement style — flagged for follow-up |
| 19 | 2026-05-16 | 0-G | Form validation pass — A/zt helpers extended with `error` prop, all 15 o.jsx forms retrofitted (red border on empty required fields). Mid-session scope expansion after user flagged inconsistency (originally 5 forms → all 15). Pre-existing PO crash (M1v2 dispatch key) fixed. Site Diary tightened (was effectively no-op due to auto-filled date). 2 follow-up tasks spawned: createElement-style form conversion (POFormV2/Cl1/k1v2/RF1), WORKFLOW.md update for comprehensive-scope principle |
| 20 | 2026-05-16 | docs | WORKFLOW.md §8: added "scoping cross-cutting polish" principle — codifies the lesson from session 19 about retrofitting patterns across every affected component, not just high-traffic subsets |
| 21 | 2026-05-16 | 0-G | Typography & color tokens added (v.h1/h2/caption + d.bgSubtle/posBg/negBg/warnBg/accentBg/lilacBg); 8 page titles standardised to 26; 10 inline hex backgrounds folded into tokens. **Phase 0-G complete — all 8 items done.** |
| 22 | 2026-05-18 | docs | Integrated CONTRACTS_REFERENCE.md §10 backlog into ROADMAP — added phase 0-H (Statutory Compliance Foundations) and Phase 1.5 (Compliance Workflows); extended Phase 2 data-model scope and Phase 5 backend scope (audit log, owner portal, state threshold tables). CONTRACTS_REFERENCE.md committed to repo root |
| 23 | 2026-05-21 | 0-H | Statutory Compliance Foundations shipped — project compliance fields (state/contractForm/contractClassification/estimatedValue/isRenovationWithUnknownCost/qldHwsAcknowledged) + state-aware project validation (VIC s.13 hard-block; QLD QBCC ack; WA flag; deposit cap text); SOPA fields on ClaimForm1 only (not invoices — those are received, not issued); variation reasonCategory + timeImpactDays + consecutive editable ID + Requested By dropdown + Other-comment fields; Settings extended (home state, ABN, 8 licences, 5 insurance regos); fixed latent St1 focus-loss bug. 4 commits squashed |
| 24 | 2026-05-21 | 1 | LocalStorage persistence — Z1Persisted higher-order reducer + lazy init from `sw_state_v1`; Reset to Demo Data button in Settings; smoke-test surfaced 3 latent bugs all fixed in same PR (I0 edit wiping nested arrays; "Worksite" hardcoded in header + greeting; insurance grid + depositCapText missing TAS/ACT/NT). 5 commits squashed. **Phase 1 complete — real user testing unblocked.** |
| 25 | 2026-05-21 | chore | Cleared 2 parked chips before pushing into Phase 1.5: (a) sidebar nav reset — `navEp` epoch counter passed as `key` prop to top-level module renders; clicking same sidebar item now resets module-internal detail-view state (fixes session-16 papercut for Leads + Estimating); (b) Cl1 empty-state colSpan 8→10 to span full 10-column table (session-18 audit re-verified — empty states exist in all 3 createElement modules; only Cl1 had the colSpan glitch) |
| 26 | 2026-05-22 | UX | LLM Council UX/UI report audited against source — several council claims overstated/inaccurate (Project Health % is labelled, KPI colours are semantic, alerts "+N more" intentional, nav has full labels, onboarding exists). Shipped 9 confirmed fixes: splash "tap anywhere to enter" affordance; Portfolio Margin copy-pasted subtitle; greeting now uses new `sw_user` "Your Name" setting with plain "Good morning." fallback; new variations default `requestedBy:"Owner"`; Estimating line totals use whole-dollar `k()` not `K0()`; Cash Flow "$0 Committed" legend hidden when empty; Overview BOQ table filters all-zero placeholder codes (44→25 rows; BOQ editor still keeps all); Project Health % gains "committed vs budget" descriptor. **Diagnosed the council's "dead whitespace" — `j1v2` rendered `React.createElement("j1",…)` with a string tag, so the entire Cash Flow summary chart silently never mounted; fixed to the component reference, restoring the chart.** Deferred: forecast model rebuild, mobile/responsive, 13-tab nav grouping |
| 27 | 2026-05-22 | 1.5 | Phase 1.5 item 1: Prime Cost items + Provisional Sums as first-class entities. New `primeCostItems` + `provisionalSums` state (keyed by projectId) with 6 reducer cases (ADD/UPDATE/DELETE × PC/PS). New project tab "PC & PS" inserted between BOQ and Variations renders Pcps module with two tables, reconciliation columns (Variance / Margin on Excess / Net to Claim — margin applied on excess only per §7.4) + section totals + empty states. Two new forms `pcf` + `psf` with `att` validation. Lazy initializer extended for forward-compat with Phase 1 localStorage. Seed data added for all 4 projects |
| 28 | 2026-05-24 | 1.5 | **Phase 1.5 closeout — all 5 items + 2 follow-up fixes shipped.** Item 2 substantiation merged after audit-driven batch fix (CC dropdown empty-state, claimNo state-init, Cl1 edit-modal + list-cell positional fallback). Then six PRs back-to-back: 1.5-B BOQ "+ Cost Code" form upgrade (auto-numbered Code + 43-category dropdown — addresses the actual user-reported bug, which lived in `p1`, not InvFormV2); 1.5-C "Import Template" button with new IMPORT_TEMPLATE_INTO_BOQ reducer case (dedupes by code, cross-template merges); 1.5-E `certificates[]` on subcontractor with typed file picker + expiry chips; 1.5-D project "Calendar" tab (`Calx`) aggregating milestones / defects logged / sub PL/WC expiries / cert expiries with EXPIRED + ≤30d chips; 1.5-F owner-facing open-book report tab (`Obx`) with full contract/cost/variations/claims/invoices/PC-PS/retention summary + Print to PDF button. Every PR verified in browser preview before merge — bracket balance (3, 3, 3) and no console errors throughout. **Phase 1.5 complete.** Next: migration handoff docs (HANDOFF.md in repo + private VENDOR_BRIEF.md) so the project can be shopped to a developer for the React-project scaffold work |
| 29 | 2026-05-25 | 2 | **Phase 2 — Architecture Documentation shipped.** Inventory pass enumerated 44 reducer actions + 26 entities. Wrote `DATA_MODEL.md` (681 lines): every entity with current + Phase 5 target fields (per CONTRACTS_REFERENCE.md §10), identifier convention, 3 storage patterns, ASCII ERD, localStorage shape under `sw_state_v1`. Wrote `ARCHITECTURE.md` (505 lines): comprehensive — what this is, why single-file, ASCII high-level architecture, two rendering styles (`o.jsx` vs `React.createElement`) with which components use each, 36-entry component map, 44-action reducer catalogue grouped by domain, state shape summary, `Z1Persisted` lazy initializer + `sw_state_v1` versioning, design decisions + tradeoffs table, 16 known tech-debt items prioritised, recommended Phase 4 first-week porting plan. Seed data updated with 4 targeted additions: PRJ-005 "Hilltop Renovation" fixed-price VIC project (exercises substantiation-skip path); SUB-001 certificates[] with current/amber/expired states; 3 edge-case progress claims on PRJ-001; PC-001 + PS-001 marked Reconciled with actualCost > allowance. **Inline-comments item skipped by design** — Phase 4 un-minify makes them obsolete and ARCHITECTURE.md covers navigation. Cross-check pass confirms 44/44 documented actions present in code and 36/36 documented components present. Browser smoke test: app loads with no console errors, PRJ-005 renders as FIXED PRICE with full 7-row BOQ. **Phase 2 complete.** Next: Phase 4 React scaffold or Phase 3 PDF/print export — your call |

*Last updated: 2026-05-25 (session 29 — Phase 2 closed out; next: Phase 4 React scaffold or Phase 3 PDF/print export)*
