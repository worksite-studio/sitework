# DATA_MODEL.md — SITEWORK entity reference

> **2026-07-04 note:** the seed/`index.html` referenced below now lives at `legacy/index.html` (canonical baseline, serve on :8766 — see `PARITY.md`).

Every entity in SITEWORK with its field set, sourced from the current seed in `index.html`. Phase 5 will translate this into a PostgreSQL schema; Phase 4 will translate it into TypeScript interfaces. This document is the bridge.

For each entity:
- **Current fields** — what's in the running app today (verified against seed `index.html` as of session 29, commit `6316bfc`+).
- **Target additions** — fields from `CONTRACTS_REFERENCE.md §10` ("Phase 2" entries) not yet in the app. Phase 5 schema must include these.
- **Relationships** — how this entity links to others.
- **Notes** — where the entity lives in state, recent additions, gotchas.

Field types are inferred from seed values; treat as suggestions, not contracts. Phase 5 should validate types against actual usage when generating migrations.

---

## 1. Identifier convention

Every entity has a string `id` of the form `{PREFIX}-{NNN}` (e.g. `PRJ-001`, `INV-007`, `CC-204`).

| Prefix | Entity |
|---|---|
| `PRJ-` | Project |
| `CLI-` | Client |
| `LED-` | Lead |
| `EST-` | Estimate |
| `EC-` | EstimateCode (within Estimate) |
| `TPL-` | BoqTemplate |
| `SUB-` | Subcontractor |
| `MAT-` | Material |
| `SUP-` | Supplier |
| `CC-` | CostCode (within Project) |
| `LI-` | LineItem (within CostCode) |
| `VO-` | Variation |
| `INV-` | Invoice |
| `PO-` | Purchase (PO) |
| `CLM-` | ProgressClaim |
| `MS-` | Milestone |
| `DY-` | DiaryEntry |
| `SEL-` | Selection |
| `TS-` | Timesheet |
| `DEF-` | Defect |
| `RFI-` | RFI |
| `PC-` | PrimeCostItem |
| `PS-` | ProvisionalSum |

In Phase 5 these become UUIDs. The human-readable prefix-NNN format is preserved as a `display_id` column for builder-facing screens (builders type `INV-042` in conversation; UUIDs are unreadable).

---

## 2. State organisation

Three storage patterns in current state:

**Top-level arrays** — entities that aren't tied to a single project. Iterated globally, sliced for project views via foreign keys.

`projects[]`, `clients[]`, `subs[]`, `leads[]`, `estimates[]`, `materials[]`, `suppliers[]`, `templates[]`

**Per-project keyed dictionaries** — `{projectId: [entityArray]}`. Lookups by project id are O(1); cross-project iteration is O(n) over keys.

`milestones{}`, `diary{}`, `timesheets{}`, `defects{}`, `selections{}`, `claims{}`, `purchases{}`, `primeCostItems{}`, `provisionalSums{}`, `rfis{}`, `retention{}`

**Nested inside Project** — entities that conceptually belong to a single project and never need cross-project iteration.

`project.codes[]`, `project.variations[]`, `project.invoices[]`, plus the line-items dictionary keyed by cost-code id.

**Phase 5 translation:** all three patterns flatten into Postgres tables with a `project_id` foreign key column. The per-project-keyed pattern is a denormalisation that exists because there's no DB join in localStorage; it dies in Phase 5.

---

## 3. Entity reference

### 3.1 Project

Top-level: `state.projects[]`. The central entity — everything attaches to a project.

**Current fields** (from seed `PRJ-001`):

| Field | Type | Notes |
|---|---|---|
| `id` | string | `PRJ-001`, `PRJ-002`, … |
| `name` | string | display name |
| `clientId` | string | FK → `Client.id` |
| `address` | string | site address |
| `status` | enum string | `"live"`, `"complete"`, …  |
| `startDate` | date string | `YYYY-MM-DD` |
| `margin` | number | percent (e.g. `15` = 15%) |
| `contractType` | enum string | `"cost-plus"` \| `"fixed-price"` |
| `state` | enum string | `"NSW"`, `"VIC"`, `"QLD"`, … (added Phase 0-H) |
| `contractForm` | enum string | `"HIA"`, `"MBA"`, `"FairTradingNSW"`, … (added Phase 0-H) |
| `contractClassification` | enum string | `"Domestic"` \| `"Commercial"` (added Phase 0-H) |
| `estimatedValue` | number | cost-plus only; the fair-and-reasonable estimate (added Phase 0-H) |
| `isRenovationWithUnknownCost` | bool | VIC s.13 exemption flag (added Phase 0-H) |
| `qldHwsAcknowledged` | bool | QBCC home warranty scheme consequence acknowledged (added Phase 0-H) |
| `codes` | array of CostCode | nested |
| `variations` | array of Variation | nested |
| `invoices` | array of Invoice | nested |

**Target additions** (per `CONTRACTS_REFERENCE.md §10`, not yet in app):

| Field | Type | Drives |
|---|---|---|
| `contractValue` | decimal (incl. GST) | deposit cap calculations, retention cap |
| `completionDate` | date | statutory warranty calendar start |
| `practicalCompletionDate` | date | defects liability period start |
| `defectsLiabilityPeriod` | int (months, default 12) | when defect rectification window closes |
| `retentionRate` | decimal (default 0.05) | progress claim retention math |
| `retentionCap` | decimal (default 0.05 × contractValue) | maximum retention held |
| `hbcfCertificateNumber` | string | insurance cert reference |
| `hbcfProvidedDate` | date | proof-of-delivery to owner |

**Relationships:**
- `clientId` → `Client.id` (many-to-one)
- has-many: CostCode, Variation, Invoice (nested), plus all per-project-keyed entities

**Notes:** `contractType` strings in seed use lowercase-hyphen (`"cost-plus"`, `"fixed-price"`), not the PascalCase the `§10` schema uses (`"CostPlus"`, `"FixedPrice"`). Standardise during Phase 5 migration.

---

### 3.2 Client

Top-level: `state.clients[]`. Property owner (residential) or principal (commercial).

| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `abn` | string (optional, blank for non-entity owners) |
| `contact` | string |
| `phone` | string |
| `email` | string |
| `address` | string |

**Relationships:** referenced by `Project.clientId` and `Lead.clientName` (string match, not FK — Phase 5 should convert leads to true FK).

---

### 3.3 Lead

Top-level: `state.leads[]`. Pre-project pipeline.

| Field | Type |
|---|---|
| `id` | string |
| `name` | string | project working name |
| `clientName` | string | not yet a Client record |
| `value` | number | expected contract value |
| `stage` | enum string | `"prospect"`, `"tendering"`, `"won"`, `"lost"` |
| `source` | string | `"Referral"`, `"Web"`, … |
| `followUp` | date | next contact date |
| `notes` | string |
| `created` | date | lead capture date |

**Relationships:** converted to Project + Client via `CONVERT_LEAD_TO_PROJECT` reducer action.

---

### 3.4 Estimate

Top-level: `state.estimates[]`. Pre-contract pricing exercise.

| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `clientId` | string | FK → Client |
| `address` | string |
| `status` | enum string | `"draft"`, `"sent"`, `"won"`, … |
| `createdDate` | date |
| `margin` | number | percent |
| `codes[]` | array of EstimateCode | nested |

**Reducer actions:** `ADD_ESTIMATE`, `UPDATE_ESTIMATE`, `ADD_EST_CODE`, `CREATE_ESTIMATE_FROM_TEMPLATE`, `PROMOTE_ESTIMATE`.

**Relationships:** can be promoted to a Project (creates `PRJ-` with copied codes).

---

### 3.5 EstimateCode (nested in Estimate)

| Field | Type |
|---|---|
| `id` | string | `EC-001` |
| `code` | string | display code (`"001"`, `"010"`) |
| `desc` | string |
| `budget` | number |

Simpler than CostCode — no committed/actual/vars columns; estimates don't track delivery.

---

### 3.6 BoqTemplate

Top-level: `state.templates[]`. Reusable BOQ skeletons. 6 templates ship in seed (added in 1.5-C as the source for project BOQ import).

| Field | Type |
|---|---|
| `id` | string | `TPL-001` |
| `name` | string |
| `desc` | string |
| `icon` | string | display hint |
| `type` | enum string | `"residential"` \| `"commercial"` |
| `codes[]` | array of `{code, desc, pct}` | budget is a percentage of total, not an absolute amount |

**Notes:** Template codes carry `pct` (percentage), not `budget`. Consumers compute absolute budgets from `pct × projectValue` (Estimating flow) or copy without budget (BOQ import flow, 1.5-C).

---

### 3.7 Subcontractor

Top-level: `state.subs[]`.

| Field | Type | Notes |
|---|---|---|
| `id` | string |
| `name` | string |
| `trade` | string | e.g. `"Carpentry / Joinery"` |
| `contact` | string | primary contact name |
| `phone` | string |
| `email` | string |
| `abn` | string |
| `licence` | string | trade licence number |
| `liabilityExp` | date | Public Liability expiry |
| `liabilityAmt` | number | PL cover ($) |
| `wcExp` | date | Workers Comp expiry |
| `swms` | bool | Safe Work Method Statement on file |
| `rating` | int 1–5 | builder's quality rating |
| `notes` | string |
| `projects[]` | array of string | project IDs this sub is assigned to (many-many denorm) |
| `certificates[]` | array of Certificate | added 1.5-E; see below |

**Certificate** (nested in `subs[].certificates`):

| Field | Type |
|---|---|
| `id` | string |
| `type` | enum string | `"PL"`, `"WC"`, `"PI"`, `"Licence"`, `"Other"` |
| `file` | `{name, dataUrl, size}` | base64 in dataUrl |
| `expiry` | date |
| `uploadedAt` | date |

**Target additions:** none from §10.

**Notes:** `subs[].projects[]` is currently a denormalised array on the sub. Phase 5 should normalise to a `project_subcontractors` join table.

---

### 3.8 Material

Top-level: `state.materials[]`.

| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `cat` | string | category, e.g. `"Cladding"` |
| `unit` | string | `"m²"`, `"sheet"`, `"each"`, `"allow"` |
| `price` | number | unit price |
| `supId` | string | FK → Supplier |
| `sku` | string | supplier's SKU |

**Relationships:** `supId` → `Supplier.id`.

---

### 3.9 Supplier

Top-level: `state.suppliers[]`.

| Field | Type |
|---|---|
| `id` | string |
| `name` | string |
| `abn` | string |
| `contact` | string |
| `phone` | string |
| `email` | string |
| `address` | string |

**Relationships:** referenced by `Material.supId`, `Purchase.supplier` (string name — not yet an FK), `Invoice.supplier` (string name).

**Notes:** Several places use supplier *name* as a string field rather than an FK. Phase 5 should normalise.

---

### 3.10 CostCode (nested in Project)

| Field | Type |
|---|---|
| `id` | string | `CC-001` |
| `code` | string | display code (`"001"`, `"020"`) |
| `desc` | string |
| `budget` | number | original budget |
| `committed` | number | sum of POs raised |
| `actual` | number | sum of invoices paid |
| `vars` | number | sum of approved variations on this code |

**Reducer actions:** `ADD_CODE`, `UPDATE_CODE`, `DELETE_CODE`, `MOVE_CODE_UP`, `MOVE_CODE_DOWN`, `IMPORT_TEMPLATE_INTO_BOQ` (bulk add from template, 1.5-C).

---

### 3.11 LineItem (nested under CostCode)

Stored as `{ccId: [LineItems]}` map within the project. Granular breakdown of a cost code into specific scope items.

| Field | Type |
|---|---|
| `id` | string | `LI-001` |
| `desc` | string |
| `qty` | number |
| `unit` | string |
| `rate` | number |
| `matId` | string \| null | optional FK → Material |
| `supId` | string \| null | optional FK → Supplier |

**Reducer actions:** `ADD_LINE_ITEM`.

---

### 3.12 Variation (nested in Project)

| Field | Type | Notes |
|---|---|---|
| `id` | string | `VO-001` |
| `ccId` | string | FK → CostCode |
| `desc` | string |
| `amount` | number | total value (excl GST in seed) |
| `status` | enum string | `"Pending"`, `"Approved"`, `"Rejected"`, … |
| `date` | date |
| `reasonCategory` | enum string | `"OwnerRequested"`, `"LatentCondition"`, `"Regulatory"`, `"DesignClarification"`, `"BuilderFault"` (added Phase 0-H) |
| `timeImpactDays` | int | extension of time days requested (added Phase 0-H) |

**Target additions** (per §10):

| Field | Type | Notes |
|---|---|---|
| `signedByOwner` | date \| null | when owner signed the variation |
| `signedByBuilder` | date \| null | when builder signed |
| `workCommencedBeforeSignature` | bool | compliance flag — NSW HBA mandates pre-work signature |

**Reducer actions:** `ADD_VARIATION`, `UPDATE_VARIATION`.

---

### 3.13 Invoice (nested in Project)

| Field | Type | Notes |
|---|---|---|
| `id` | string | `INV-001` |
| `ccId` | string | FK → CostCode |
| `supplier` | string | currently a name, not FK |
| `amount` | number | $ incl. GST |
| `status` | enum string | `"Pending"`, `"Approved"`, `"Paid"`, `"Disputed"` |
| `date` | date | invoice date |
| `due` | date | payment due date |
| `xero` | bool | pushed to Xero (Phase 6+ integration flag, currently mock) |
| `supportingDocs[]` | array of file refs | added 1.5-A; mandatory for cost-plus projects |

**Target additions** (per §10):

| Field | Type | Notes |
|---|---|---|
| `madeUnderSOPAct` | bool | flagged as a statutory progress claim |
| `sopActState` | enum string | which state's SOPA Act applies |

**Reducer actions:** `ADD_INVOICE`, `UPDATE_INVOICE`.

**Notes:** `supportingDocs[]` items are `{name, dataUrl, size}` (base64). Phase 5 must move to object storage; localStorage's ~5MB cap is already a constraint with even a few PDF receipts.

---

### 3.14 Purchase / PO

Per-project: `state.purchases[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `PO-001` |
| `ccId` | string | FK → CostCode |
| `supplier` | string | name |
| `desc` | string |
| `amount` | number | $ incl. GST |
| `status` | enum string | `"draft"`, `"sent"`, `"received"` |
| `date` | date | PO date |
| `dueDate` | date | expected delivery |
| `receivedDate` | date \| null | when delivered |
| `notes` | string |

**Reducer actions:** `ADD_PURCHASE`, `RECEIVE_PURCHASE` (sets `status: "received"` + `receivedDate`).

---

### 3.15 ProgressClaim

Per-project: `state.claims[projectId][]`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | `CLM-001` |
| `claimNo` | int | sequential per project (added session 28 — see WORKFLOW §8 scope note) |
| `desc` | string | claim description, e.g. `"Stage 1 — Site Establishment"` |
| `date` | date | claim issue date |
| `due` | date | payment due |
| `amount` | number | $ incl. GST |
| `status` | enum string | `"Draft"`, `"Issued"`, `"Approved"`, `"Paid"`, `"Disputed"` |
| `notes` | string |
| `madeUnderSOPAct` | bool | added Phase 0-H |
| `sopActState` | enum string | added Phase 0-H |
| `supportingDocs[]` | array of file refs | added 1.5-A; mandatory for cost-plus projects |

**Reducer actions:** `ADD_CLAIM`, `UPDATE_CLAIM`.

**Notes:** Cost-plus projects gate save on at least one `supportingDocs[]` entry (Phase 1.5-A). Fixed-price projects do not require docs.

---

### 3.16 Milestone

Per-project: `state.milestones[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `MS-001` |
| `name` | string |
| `date` | date | target / actual date |
| `status` | enum string | `"upcoming"`, `"in-progress"`, `"complete"`, `"delayed"` |
| `notes` | string |

**Reducer actions:** *none with `MILESTONE` in the type name* — mutations appear to flow through other actions. Phase 4 should introduce explicit `ADD_MILESTONE` / `UPDATE_MILESTONE`.

**Surfaced in:** project Milestones tab; Calendar tab (1.5-D).

---

### 3.17 DiaryEntry

Per-project: `state.diary[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `DY-001` |
| `date` | date |
| `weather` | string | free text |
| `workers` | int | head count |
| `subs[]` | array of string | sub names on site |
| `hours` | number | total person-hours |
| `notes` | string |
| `incidents` | bool | incident occurred flag |

**Reducer actions:** `ADD_DIARY_ENTRY`.

---

### 3.18 Selection

Per-project: `state.selections[projectId][]`. Client selections for finishes / fixtures.

| Field | Type |
|---|---|
| `id` | string | `SEL-001` |
| `category` | string | e.g. `"Kitchen"`, `"Bathrooms"` |
| `item` | string | e.g. `"Benchtop"` |
| `options` | string | free-text list of options offered |
| `notes` | string |
| `status` | enum string | `"pending"`, `"approved"`, `"declined"` |
| `approvedOption` | string \| null | which option the client chose |
| `amount` | number | $ allowance |

**Reducer actions:** `ADD_SELECTION`, `APPROVE_SELECTION`.

---

### 3.19 Timesheet

Per-project: `state.timesheets[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `TS-001` |
| `date` | date |
| `worker` | string | name |
| `role` | string | e.g. `"Builder / Supervisor"` |
| `ccId` | string | FK → CostCode |
| `hours` | number |
| `rate` | number | $/hr |
| `notes` | string |

**Reducer actions:** `ADD_TIMESHEET`, `DELETE_TIMESHEET`.

---

### 3.20 Defect

Per-project: `state.defects[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `DEF-001` |
| `item` | string | what's defective |
| `location` | string | where on site |
| `trade` | string | responsible trade |
| `dateLogged` | date |
| `dateRectified` | date \| null |
| `status` | enum string | `"Open"`, `"Rectified"`, `"Disputed"` |
| `notes` | string |

**Reducer actions:** `ADD_DEFECT`, `UPDATE_DEFECT`.

**Surfaced in:** Defects tab, Calendar tab (warranty expiry calcs in 1.5-D).

---

### 3.21 RFI

Per-project: `state.rfis[projectId][]`.

| Field | Type |
|---|---|
| `id` | string | `RFI-001` |
| `rfiNo` | int | sequential per project |
| `subject` | string |
| `addressee` | string | e.g. architect or engineer name |
| `dateIssued` | date |
| `dateRequired` | date | response deadline |
| `dateResponded` | date \| null |
| `response` | string | reference to drawing rev, doc id, or free text |
| `status` | enum string | `"Open"`, `"Closed"`, `"Overdue"` |

**Reducer actions:** *none with `RFI` in the type name* — mutations likely flow through other actions; Phase 4 should introduce explicit ones.

---

### 3.22 PrimeCostItem

Per-project: `state.primeCostItems[projectId][]`. Added Phase 1.5 item 1.

| Field | Type |
|---|---|
| `id` | string | `PC-001` |
| `description` | string |
| `allowance` | number | $ ex GST, the contractual allowance |
| `marginRate` | decimal | builder's margin, typically `0.20` |
| `actualCost` | number | reconciled actual (starts at 0) |
| `status` | enum string | `"Pending"`, `"Selected"`, `"Procured"`, `"Reconciled"` |

**Reducer actions:** `ADD_PC_ITEM`, `UPDATE_PC_ITEM`, `DELETE_PC_ITEM`.

**Behaviour:** when `actualCost > allowance`, margin applies only to the excess (cost-plus rule). Surfaced in PC & PS tab.

---

### 3.23 ProvisionalSum

Per-project: `state.provisionalSums[projectId][]`. Added Phase 1.5 item 1.

| Field | Type |
|---|---|
| `id` | string | `PS-001` |
| `description` | string |
| `allowance` | number |
| `marginRate` | decimal |
| `actualCost` | number |
| `status` | enum string | `"Pending"`, `"InProgress"`, `"Complete"`, `"Reconciled"` |

**Reducer actions:** `ADD_PS_ITEM`, `UPDATE_PS_ITEM`, `DELETE_PS_ITEM`.

---

### 3.24 Retention

Per-project: `state.retention[projectId]` — a single object, not an array.

| Field | Type |
|---|---|
| `rate` | decimal | typically `0.05` (5%) |
| `held` | number | total $ currently held |
| `released` | number | total $ released back |

**Reducer actions:** `UPDATE_RETENTION`.

---

### 3.25 Settings

Top-level: `state.settings`. Single record.

Fields not yet exhaustively documented — Settings module is light. Known fields include builder business name, ABN, licence, and per-builder Xero connection metadata. Phase 4 should formalise the schema before porting.

---

### 3.26 StatutoryWarranty (target — not yet in app)

Per §10, this becomes a first-class entity in Phase 5 (currently calculated on the fly in the Calendar tab from `Defect.dateRectified` + state-specific warranty period).

| Field | Type |
|---|---|
| `id` | string |
| `projectId` | FK → Project |
| `type` | enum string | `"Major"` \| `"Minor"` |
| `warrantyPeriodMonths` | int | driven by state regulations |
| `warrantyStart` | date | = `Project.completionDate` |
| `warrantyExpiry` | date | calculated: `warrantyStart + warrantyPeriodMonths` |

State-specific warranty periods are NOT in the app today. Phase 5 needs a `StatutoryRules` lookup table (per `CONTRACTS_REFERENCE.md §10`).

---

## 4. Entity relationship diagram (Phase 5 target)

```
                          ┌──────────┐
                          │  Client  │
                          └────┬─────┘
                               │1
                               │
                          ┌────▼─────┐         ┌──────────┐
                Lead ───► │ Project  │ ◄──────►│ Subcontr.│
                          └──┬──┬──┬─┘  many-  │ (assign- │
                             │  │  │   many    │  ments)  │
        ┌────────────────────┘  │  └──────┐    └──────────┘
        │                       │         │
   ┌────▼─────┐ ┌───────────┐ ┌─▼────┐ ┌──▼─────┐ ┌──────────┐
   │ CostCode │ │ Variation │ │ Inv. │ │ Claim  │ │ Purchase │
   └────┬─────┘ └───────────┘ └──┬───┘ └────┬───┘ └────┬─────┘
        │                        │          │          │
   ┌────▼─────┐                  │          │   ┌──────▼──────┐
   │ LineItem │            supportingDocs   │   │  Material   │
   └──────────┘            (Phase 5: S3)    │   └──────┬──────┘
                                            │          │
                                            │   ┌──────▼──────┐
                                            │   │  Supplier   │
                                            │   └─────────────┘
                                            │
                          (other per-project entities:
                           Milestone, Diary, RFI, Defect,
                           Selection, Timesheet, PrimeCostItem,
                           ProvisionalSum, Retention,
                           StatutoryWarranty)
```

Notes:
- All "per-project" entities collapse to single tables with a `project_id` FK.
- `Project.clientId` is already a real FK in shape; just needs DB enforcement.
- `Subcontractor` ↔ `Project` is currently a denormalised array on the sub; becomes a `project_subcontractors` join table.
- `Invoice.supplier` / `Purchase.supplier` are currently strings; should normalise to `Supplier.id` FKs.
- `Material.supId` is already a real FK in shape.

---

## 5. localStorage shape (current)

Persisted under key `sw_state_v1`. The full state object is JSON-serialised on every dispatch. A forward-compatible lazy initializer (see ARCHITECTURE.md §8) merges the stored state into the seed defaults so newly-added top-level keys don't break stored state.

```
{
  projects: [Project, …],
  clients: [Client, …],
  subs: [Subcontractor, …],
  leads: [Lead, …],
  estimates: [Estimate, …],
  materials: [Material, …],
  suppliers: [Supplier, …],
  templates: [BoqTemplate, …],
  milestones: { [projectId]: [Milestone, …] },
  diary: { [projectId]: [DiaryEntry, …] },
  timesheets: { [projectId]: [Timesheet, …] },
  defects: { [projectId]: [Defect, …] },
  selections: { [projectId]: [Selection, …] },
  claims: { [projectId]: [ProgressClaim, …] },
  purchases: { [projectId]: [Purchase, …] },
  primeCostItems: { [projectId]: [PrimeCostItem, …] },
  provisionalSums: { [projectId]: [ProvisionalSum, …] },
  rfis: { [projectId]: [RFI, …] },
  retention: { [projectId]: { rate, held, released } },
  settings: { … }
}
```

**Phase 4 migration note:** the porter should write a one-time importer that pulls this shape from localStorage into the new app on first run, so existing users (i.e. you) don't lose their saved state. After successful import, leave the localStorage entry in place but stop writing to it; the new app's persistence is its own concern.

---

*Last updated: 2026-05-24, session 29. Field inventory verified against seed in `index.html` at commit `6316bfc`. Phase 5 schema additions sourced from `CONTRACTS_REFERENCE.md §10`.*
