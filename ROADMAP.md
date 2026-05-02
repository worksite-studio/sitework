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

### 0-F: Operations Modules Audit ← NEXT
*~1.5 hours.*

- ⬜ **Site Diary**: entries, weather, labour — verify data persists and displays correctly
- ⬜ **Schedule / Milestones**: dates, completion %, link to cash flow
- ⬜ **Subcontractors**: compliance register, expiry date alerts, SWMS status
- ⬜ **Timesheets**: labour entries, link to cost codes
- ⬜ **RFIs**: log, response tracking, link to project

---

### 0-G: Supporting Modules & Global UX
*~1.5 hours.*

- ⬜ **Leads Pipeline**: stage progression, value tracking, convert to project flow
- ⬜ **Estimating** (post-merge with BOQ Templates): cost code templates, promote to live project
- ⬜ **Clients**: verify projects link correctly, contact detail complete
- ⬜ **Help & Education**: placeholder content, structure
- ⬜ **Empty states**: new user sees helpful prompts, not blank tables, in every module
- ⬜ **Form validation**: required fields highlighted, no silent failures
- ⬜ **Typography & spacing**: consistent padding, heading sizes, table density across all modules

---

## Phase 1 — LocalStorage Persistence
*Goal: Data survives browser refresh. Required before any real user testing.*
*Estimated: 1 session (~1 hour)*

- ⬜ Wrap `Z1` reducer with localStorage read on init
- ⬜ Write full state to localStorage on every dispatch
- ⬜ Handle first-run gracefully (no stored data → load seed data)
- ⬜ Add "Reset to demo data" button in Settings
- ⬜ Test: refresh page, verify all data intact

---

## Phase 2 — Architecture Documentation
*Goal: The codebase is fully mapped and understood before we migrate to a proper scaffold. This is for us — so future sessions move faster and the React migration in Phase 4 is clean.*
*Estimated: 1 session (~1.5 hours) — do this BEFORE Phase 4 scaffold*

- ⬜ **ARCHITECTURE.md**: component map (minified names → module names), reducer actions, data flow between modules
- ⬜ **DATA_MODEL.md**: every entity (Project, Client, Invoice, Variation, etc.) with field names, types, and relationships — becomes the PostgreSQL schema blueprint for Phase 5
- ⬜ **Inline comments**: brief comments above each major component in `index.html` so any session can navigate the file quickly
- ⬜ **Seed data review**: ensure seed data covers all realistic scenarios (cost-plus + fixed-price, various claim statuses, retention examples)
- ⬜ Commit all docs to repo

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

*Last updated: 2026-05-03 (session 9)*
