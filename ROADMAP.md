# SITEWORK — Construction Finance
## Product Roadmap

---

## Phase 0 — UX Audit & Polish ← current
*Goal: Every module works correctly, consistently, and handles edge cases gracefully before any new features are added.*

### Modules to audit
- [ ] Dashboard — alerts, project health, lead pipeline
- [ ] Project Overview — contract vs cost KPIs, margin erosion
- [ ] BOQ & Budget — cost codes, line items, variations overlay
- [ ] Variations register
- [ ] Invoices — GST, subcontractor linking, approval flow
- [ ] Purchase Orders — GST, subcontractor linking, receive flow
- [ ] Progress Claims — claim periods, certified vs paid
- [ ] Retention & FFC — retention tracking, DLP, FFC certificate
- [ ] Cash Flow — 12-month forecast
- [ ] Site Diary — entries, weather, labour
- [ ] Schedule / Milestones — dates, completion %
- [ ] Subcontractors — compliance register, expiry alerts
- [ ] Leads Pipeline — Kanban, stages
- [ ] Estimating — cost codes, promote to project
- [ ] Clients, BOQ Templates, Help & Education

### Global patterns
- [ ] Empty states — new user with no data
- [ ] Form consistency — inputs, modals, validation
- [ ] Cross-module data flow — do approved invoices update BOQ committed costs?
- [ ] Navigation — active states, project context
- [ ] Typography & spacing consistency

---

## Phase 1 — LocalStorage Persistence
*Goal: Data survives browser refresh and tab close. Required before any real user testing.*

- [ ] Wrap useReducer with localStorage read on init
- [ ] Write state to localStorage on every dispatch
- [ ] Handle first-run (no stored data) gracefully
- [ ] Add "Reset to demo data" option in settings

---

## Phase 2 — PDF & Print Export
*Goal: Print-ready documents for client-facing use.*

- [ ] Print CSS stylesheet (hide nav, format for A4)
- [ ] Progress Claim PDF — claim schedule, certified amounts, retention
- [ ] BOQ Export — cost codes, budget vs actual, variance
- [ ] Retention / FFC Certificate
- [ ] Invoice summary

---

## Phase 3 — Progress Claims Workflow
*Goal: Complete end-to-end claim submission flow.*

- [ ] Claim schedule tied to milestones
- [ ] Claim period selector (claim 1, 2, 3...)
- [ ] Certified vs submitted vs paid status
- [ ] Retention deduction calculated automatically
- [ ] Link to PDF export
- [ ] Cash flow updated from approved claims

---

## Phase 4 — Scaffold Proper React Project
*Goal: Move from single HTML file to maintainable codebase a contractor can work with.*

- [ ] Vite + React + TypeScript scaffold
- [ ] Extract components into separate files
- [ ] Set up ESLint, Prettier
- [ ] CI/CD pipeline (GitHub Actions → auto-deploy)
- [ ] Contractor handover documentation

---

## Phase 5 — Backend, Auth & Database
*Goal: Multi-user, data persisted server-side, subscription-ready.*

- [ ] Choose stack (Supabase recommended — PostgreSQL + Auth + API in one)
- [ ] Schema design — projects, users, organisations
- [ ] Authentication — email/password + Google OAuth
- [ ] Row-level security (each builder sees only their data)
- [ ] API layer
- [ ] Migrate frontend from localStorage to API calls

---

## Phase 6 — Xero Integration
*Goal: Two-way sync between SITEWORK and Xero.*

- [ ] OAuth 2.0 flow (requires backend)
- [ ] Map Xero contacts → SITEWORK subcontractors
- [ ] Push approved invoices to Xero as bills
- [ ] Pull payment status back from Xero
- [ ] Map Xero accounts to cost code categories

---

## Phase 7 — Rawlinson Rate Lookup
*Goal: Benchmark cost data in BOQ and Estimating.*

- [ ] Integrate Rawlinson API or static dataset
- [ ] Rate lookup in line item form
- [ ] Regional multipliers (NSW, VIC, QLD, WA, etc.)
- [ ] Rate history / edition tracking

---

## Phase 8 — Billing & Go-Live
*Goal: Paying subscribers, onboarding flow, support.*

- [ ] Stripe integration — subscription tiers
- [ ] Onboarding flow — first project setup wizard
- [ ] Trial period logic
- [ ] Terms of service, privacy policy
- [ ] Support documentation
- [ ] Production infrastructure (domain, SSL, monitoring)

---

## Tech Stack (target)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + TypeScript + Vite | Standard, contractor-friendly |
| Styling | CSS-in-JS (existing pattern) | Consistent with prototype |
| Backend | Supabase | Auth + DB + API, minimal ops overhead |
| Hosting | Vercel (frontend) + Supabase (backend) | Both have free tiers, scale well |
| Payments | Stripe | Industry standard |
| PDF | React-PDF or print CSS | Depends on complexity needed |
| Xero | Xero API v2 | Official API |

---

*Last updated: 2026-04-28*
