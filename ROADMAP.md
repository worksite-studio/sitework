# SITEWORK — Construction Finance
## Product Roadmap

> **Working principle:** Each session has a defined scope. Nothing gets added mid-session unless it's a blocker.
> All changes are committed and pushed to GitHub Pages at the end of every session.
> Developer handoff is a first-class concern at every phase — code stays readable.

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

### 0-B: Quick Fixes — Session Next ← START HERE
*~1 hour. Finish all loose ends from prior sessions before adding anything new.*

- ⬜ **Variations table row**: render `requestedBy` value in the Requested By column cell (field exists in state, header exists — cell is empty)
- ⬜ **Invoices form**: add Comments textarea before the Save button
- ⬜ **Client Selections (N1)**: rename "Category" label → "Cost Code" in the form
- ⬜ **WS avatar**: make it clickable — navigate to Settings module
- ⬜ **Estimating**: merge/absorb BOQ Templates UI into Estimating module (remove BOQ Templates as a separate module)

---

### 0-C: Dashboard & Project Overview Audit
*~1.5 hours.*

- ⬜ **Project Overview KPIs**: verify contract value, cost to date, margin erosion, forecast final cost are all accurate against seed data
- ⬜ **Dashboard clickthrough**: verify clicking project health rows navigates correctly
- ⬜ **Contract type display**: show contract type badge (Cost Plus / Fixed Price) on project overview header
- ⬜ **BOQ & Budget**: verify cost codes show correct committed vs budget, variation overlay works
- ⬜ **Margin calculation**: ensure margin is consistent across Dashboard, Project Overview, and BOQ views

---

### 0-D: Financial Workflow Audit
*~1.5 hours.*

- ⬜ **Variations full flow**: draft → pending → approved/rejected, approved amount rolls into contract value
- ⬜ **Invoices approval flow**: pending → approved → paid, approved invoices update committed costs in BOQ
- ⬜ **Purchase Orders flow**: draft → sent → received, received POs update committed costs
- ⬜ **Cross-module data flow**: confirm invoices + POs together drive "committed" in D1v2 and BOQ view
- ⬜ **GST handling**: verify GST display is consistent (ex-GST vs inc-GST labels where appropriate)

---

### 0-E: Progress Claims & Retention
*~1.5 hours.*

- ⬜ **Progress Claims**: claim number sequencing, claim period selector, certified vs submitted vs paid status
- ⬜ **Retention deduction**: verify retention % is applied correctly to each claim
- ⬜ **Defects module** (was Retention & FFC): DLP period, retention release, FFC certificate workflow
- ⬜ **Cash flow**: confirm approved claims and invoices feed into the 12-month forecast

---

### 0-F: Operations Modules Audit
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

## Phase 2 — Developer Handoff Prep
*Goal: A developer can open this codebase and understand it within 30 minutes.*
*Estimated: 1 session (~1.5 hours) — do this BEFORE migrating to React scaffold*

- ⬜ **ARCHITECTURE.md**: document the single-file structure, component map (minified names → module names), data model, reducer actions
- ⬜ **DATA_MODEL.md**: define every entity (Project, Client, Invoice, Variation, etc.) with field names, types, and relationships — written as if briefing a backend developer
- ⬜ **Inline comments**: add brief comments above each major component block in `index.html` so a developer can navigate the file
- ⬜ **Seed data review**: ensure seed data covers all realistic scenarios (cost-plus and fixed-price projects, various claim statuses, retention examples)
- ⬜ **Settings persistence**: confirm localStorage keys are documented
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
*Goal: Move from single HTML file to a maintainable, contractor-ready codebase.*
*Estimated: 2 sessions — plan carefully before starting, this is a one-way door*

- ⬜ Vite + React + TypeScript scaffold
- ⬜ Extract each module into its own file (`/src/modules/Dashboard.tsx`, etc.)
- ⬜ Extract design tokens and shared components (`/src/design/`)
- ⬜ Extract reducer and state types (`/src/state/`)
- ⬜ Set up ESLint + Prettier
- ⬜ CI/CD pipeline (GitHub Actions → deploy to Vercel or GitHub Pages)
- ⬜ All existing functionality verified in new scaffold before retiring HTML file

> **Note:** Architecture.md from Phase 2 is the blueprint for this migration. Do not start Phase 4 without it.

---

## Phase 5 — Backend, Auth & Multi-user
*Goal: Data lives server-side, multiple builders can use the product.*
*Estimated: 3–4 sessions*

- ⬜ Choose and set up Supabase project
- ⬜ Schema design — map DATA_MODEL.md to PostgreSQL tables
- ⬜ Authentication — email/password + Google OAuth
- ⬜ Row-level security (each organisation sees only their data)
- ⬜ API layer — REST or Supabase client SDK
- ⬜ Migrate frontend from localStorage → API calls
- ⬜ Organisation / workspace model (one builder firm = one workspace)

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
*Goal: Paying subscribers, onboarding, production infrastructure.*
*Estimated: 2–3 sessions*

- ⬜ Stripe — subscription tiers (Solo Builder / Small Team / Enterprise)
- ⬜ Onboarding flow — first project setup wizard
- ⬜ Trial period logic (14-day free trial)
- ⬜ Terms of service + privacy policy (Australian law)
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
| 5 | — | 0-B | Quick fixes (variations row, invoice comments, labels, avatar) |
| 6 | — | 0-C | Dashboard & Project Overview audit |
| ... | — | ... | ... |

---

*Last updated: 2026-05-02*
