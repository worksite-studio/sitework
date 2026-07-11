# PARITY.md — the baseline contract

> **The rule (re-stated by Jake, 2026-07-08):** the Vite app is being **rebuilt with `legacy/index.html` as its baseline** (serve locally at **http://127.0.0.1:8766/**). Legacy is the spec — it contains every feature built across sessions 0-A → 29. Port screens are **transliterated from the legacy source, never reinterpreted**; anything in the port that contradicts legacy gets thrown away, not adjusted. :8766 is the lift-off point for all future builds. Until every row in the gap table below is closed, no new feature work ships in the Vite app, and every session's acceptance test is a side-by-side check against :8766.

## The transliteration protocol (acceptance rule for every rebuild session)

1. **Locate the legacy source** via the minified-name map in `ARCHITECTURE.md` (36 components: `D1` Overview, `j1v2` Cash Flow, `G1` Leads, `St1` Settings, …) and extract it from `legacy/index.html` with Python string tools. The legacy file is **read-only** during the rebuild.
2. **Transliterate verbatim** into React/TS — same headings, columns, copy, colours, maths, empty states. Reuse the PV primitives (`sitework/src/components/ui/*`, tokens already repointed to legacy `d`/`v` verbatim).
3. **Acceptance = indistinguishable side-by-side vs :8766**: regenerate the pair with `sitework/scripts/parity-shots.mjs`; the *numbers on screen must match exactly* — layout parity alone doesn't close a row.
4. Port-additive features are kept **only** where the gap-12 table marks them "keep". No new inventions during the rebuild.
5. The root URL keeps serving the baseline until the final full-sweep session (R8) passes.

Start the baseline server:

```bash
cd legacy && python3 -m http.server 8766 --bind 127.0.0.1
```

The baseline also deploys with the app: every push to `main` publishes it at **https://sitework-eight.vercel.app/legacy** (wired in `vercel.json` — the build copies `legacy/index.html` into `dist/legacy/`; verified byte-identical 2026-07-04). Same file, same bytes, always up to date with the repo — use it when a local server isn't running. The Vite app deploys at https://sitework-eight.vercel.app/.

Why this file exists: on 2026-07-04 the port was caught being treated as the finished product. A full audit against the baseline found ~40 features ported faithfully and the gaps below silently dropped — including the entire project-creation form and its statutory compliance validation. This table is the single source of truth for what remains.

## Gap table (audit: 2026-07-04 · full re-audit 2026-07-08)

The 2026-07-08 re-audit ran the complete side-by-side sweep (26 fresh screenshot pairs in `sitework/parity-shots/`, interaction checks, e2e regression). Rows 1/7/10/11 verified holding. Gap 12's per-tab enumeration now lives in its own section below the table. Rows 13–18 are new findings from that sweep.

| # | Gap | Built in (legacy session) | Vite status | Severity | Closed |
|---|-----|---------------------------|-------------|----------|--------|
| 1 | Project create/edit form (`I0`) + statutory validation: VIC s.13 hard-block (red banner; Save stays clickable but refuses, matching legacy), QLD `qldHwsAcknowledged` checkbox, WA flag, deposit-cap helper under state select | 0-H (session 23) | Ported session P1 — `ProjectForm.tsx` + `src/lib/statutory.ts` (21 unit tests pin verbatim copy/thresholds) + 7 e2e specs. Note: legacy seeded defaults from `sw_ct`/`sw_state` Settings keys — wires up in P2. Re-verified 2026-07-08: all 7 e2e specs green | Critical | ✅ |
| 2 | Settings: default contract type + default margin % + GST-registered (these seed the project form via `sw_ct`/`sw_state`), home state, 8 state-keyed builder licences, **9** insurance registration fields (HBCF NSW / DBI VIC / VBA VIC / QBCC QLD / HII WA / BII SA / ACT Fidelity / TAS / NT) | session 23 (`St1`) | Closed session R4 — full `St1` transliteration (ruled `stSec` sections, boxed inputs, verbatim labels/explainers, Save Settings + Saved! flash); Settings type formalises the field set; project-form defaults wired (new project seeds contractType/homeState from Settings — e2e-pinned, closing gap 1's deferred note). Backup/Integrations cards kept (additive). Pair + text dump verified vs :8766 | Critical | ✅ |
| 3 | Settings: Reset to Demo Data (red button + confirm + clear + reload) | session 24 | Closed session R4 — red-outline button with legacy's verbatim confirm copy; clears `sw_state_v2` + `sw_state_v1` and reloads to seed | High | ✅ |
| 4 | Variation `requestedBy` (Owner/Builder/Architect/Other, default Owner) + `reasonCategory` "Other" value + conditional comment fields; REQUESTED BY table column; count sub-line | 0-H + session 26 | Closed session R6 — `v1` transliterated in full (editable mono VO-id, Requested By select, spaced reason labels incl. Other, Time Impact, both conditional comment fields w/ verbatim placeholders); `B1` table rebuilt (ID / Description / Requested By / full Cost Code / Amount / Status / Date, "7 variations · …" sub-line w/ violet pending); port's raw-enum Reason column removed. e2e pins the conditional fields. Pair verified vs :8766 | High | ✅ |
| 5 | PC/PS add/edit forms (`pcf` / `psf` with validation) | session 27 | Closed session R6 — shared `PcPsForm` transliterated (description + allowance>0 validation, margin rate 0.2 default, kind-specific status sets, red-outline Delete w/ verbatim confirm); row-click edit; `Pcps` page anatomy completed (title + margin-on-excess explainer, section heads w/ Add buttons, inline totals footers, grey RECONCILED per legacy He default). e2e covers validation + happy path. Pair verified vs :8766 | High | ✅ |
| 6 | Help & Education: 4 tabs (Start / Modules / Glossary / Rawlinson), 3 getting-started guides, 6 module docs, 14-term glossary — all real content | 0-G (session 17) | `/education` is a Placeholder stub | Medium | ⬜ |
| 7 | Splash screen (`Lp`, "tap anywhere to enter") | original entry flow | Ported session PV — verbatim `Splash.tsx` (88px wordmark, lilac pixel grid), shows every full load, e2e-covered. Re-verified 2026-07-08: pixel-identical pair, both e2e specs green | Medium | ✅ |
| 8 | Session-26 visual fixes: Overview BOQ filters all-zero placeholder codes (44→25 rows); Cash Flow "$0 Committed" legend hidden when empty; Project Health "committed vs budget" descriptor | session 26 | All three closed: descriptor ✅ (2026-07-08 audit), Overview zero-code filter ✅ (R1, e2e-pinned), Cash Flow committed-legend conditional ✅ (R3 — verified live: zero committed hides the legend entry) | Medium | ✅ |
| 9 | DUPLICATE_PROJECT — reducer action exists, no UI button | session 29 inventory | Closed session R1 — "Duplicate Project" ghost button on the Overview Contract-vs-Cost panel header (where legacy `D1v2` has it); reducer arm transliterated to legacy `Z1` semantics (copy starts at `planning`, invoices + variations cleared, "(Copy)" suffix), pinned by reducer test | Low | ✅ |
| 10 | **Visual design system** — the baseline's actual design language: horizontal top nav (uppercase, letterspaced) with spaced-caps SITEWORK wordmark (no sidebar), editorial stat blocks (large numbers over heavy black rules, colour accents: purple money / pink alerts / green-purple status dots), ruled list panels instead of rounded cards, "Good morning." display headline, legacy `d` colour + `v` type tokens | sessions 21, 26 + original design | Closed session PV — tokens repointed to legacy `d` verbatim; every primitive rewritten to baseline spec (underline inputs, square modals, bare-text badges, ink-ruled tables); top nav + 44px project sub-bar; 28 side-by-side screenshot pairs in `sitework/parity-shots/`. Re-verified 2026-07-08: holding on all screens except Subcontractors, which still uses filled pill badges (PL/WC Expired, ATTENTION) instead of baseline bare-text statuses — fix with gap 12's Subs row | **Critical** | ✅ |
| 11 | Dashboard layout parity — Alerts & Compliance list panel leads the page ("+N more alerts" overflow), "Good morning. / Here's where things stand today." heading block, Budget & Margin ruled column beside Project Health, KPI sublabels ("$0.7M contract value") | 0-A + session 26 | Closed session PV — Alerts & Compliance panel leads, greeting block, editorial stat blocks, Budget & Margin column restored, phantom H1 removed. Re-verified 2026-07-08: holding; the "$0.5M vs $0.7M contract value" sublabel delta is gap 17, not layout | High | ✅ |
| 12 | Per-table column/content parity — legacy tables carry richer content the port dropped. Enumerated tab-by-tab 2026-07-08: see **"Gap 12 — per-tab enumeration"** section below | sessions 0-D/0-E | **Closed** — every row ✅ across R2 (money tables), R5 (Clients/Subs/Estimating), R6 (Variations/PC&PS), R7 (the remaining eight surfaces) | High | ✅ |
| 13 | **Project Overview tab structure** — legacy = `D1` (5 stat blocks: CONTRACT VALUE w/ target margin · ORIGINAL BUDGET w/ % spent · APPROVED VARIATIONS · TRUE OVERRUN · OUTSTANDING INVOICES + the full analytic BOQ table, zero-placeholder codes filtered 44→25) followed by `D1v2`'s Contract-vs-Cost KPI panel (incl. Duplicate Project button) | 0-A → session 26 (`D1`+`D1v2`) | Closed session R1 — page rebuilt as `D1`+`D1v2` verbatim: 5 stat blocks (content-width ink rules, legacy colours/sublabels), analytic BOQ table (zero-code filter, abs-value overrun display, Ma health badges), Contract-vs-Cost 4-KPI panel (accent rules, Duplicate Project). Port's invented KPI set + Project-info panel thrown away. Side-by-side pair verified | High | ✅ |
| 14 | **Cash Flow tab** — legacy: 3 stat blocks (TOTAL COMMITTED / PAID TO DATE / OUTSTANDING), Monthly Cost Outflows bar chart (paid vs approved + legend), month table (PAID / APPROVED / TOTAL / CUMULATIVE), Forward Cash Flow Forecast (12-month outlook) | session 26+ (`j1`+`j1v2`) | Closed session R3 — full `j1`+`j1v2` transliteration: stats ($173,530/$52,988/$120,542), stacked outflows chart w/ legend, month table (cumulative = paid-only running sum, per legacy), forward forecast ($220,578 remaining spread across 12 months, committed #2563EB / forecast #BFDBFE, conditional Committed legend = gap 8b), 3 mini stats. Legacy quirks kept: fixed Sep-25→Jun-26 history window. Port's single-bar invention thrown away. Pair verified vs :8766 | High | ✅ |
| 15 | **Leads pipeline board** — legacy is a 5-column kanban (PROSPECT / TENDERING / QUOTED / WON / LOST, colour-coded headers) titled "Lead Pipeline · 4 active · $2.1M" | original | Closed session R5 — `G1` transliterated in full: kanban (colour squares, per-column $K totals, hover cards, Empty placeholders), lead detail drill-in (stage select, mini stats, notes, ✓-converted banner), **Convert to Project restored** (`Cv1` dialog + legacy `Z1` convert semantics — the port had the reducer action but no UI); `LeadStage` regains 'quoted'. Pair verified vs :8766 | High | ✅ |
| 16 | **BOQ & Budget editable list** — legacy BOQ tab is an edit surface (`w1`): expandable rows w/ line-items tables + "+ Add Line Item" (`g1` form), live committed-vs-budget pair (per-code from invoices+POs, `Gc`), amber Approved Variations sub-tables, per-row reorder ↑↓ / edit ✎ / delete ×, Import Template + "+ Cost Code" | 0-D | Closed session R1 — `w1` transliterated in full incl. `Gc` (`codeDocTotals`), `g1` (`LineItemForm`), legacy dialog titles and confirm copy; analytic table moved to Overview where legacy has it. Export button kept (additive). Side-by-side pair verified | Medium | ✅ |
| 17 | **Contract-value semantics** — legacy contract value = **budget ÷ (1 − margin/100)** (exact formula extracted from legacy `D1`/`D1v2`/`Obx` source in R0; dashboard "$0.7M contract value"; Overview $273,566 vs budget $232,531; Open Book adjusted $352,279, cost-to-date $268,357 = invoices≠Rejected + POs≠cancelled) | sessions 0-A → 13 | Closed session R0 — legacy maths transliterated into `computeFinancials.ts` (contract value, adjusted CV, true overrun, committed/cost-to-date, PC/PS net = variance + margin-on-excess, dashboard portfolio KPIs); Dashboard/Overview/Open Book/PC&PS/Claims all render :8766's exact numbers, pinned by unit tests. Estimating's sell-total display lands with its R5 screen rebuild (tracked in the gap-12 Estimating row) | **Critical** | ✅ |
| 18 | **Claims retention units bug** — legacy stores rate as a PERCENT (`rate: 5`) and computes `amount × rate/100` (default 5); the port read it as a fraction → −$225,000 retention on a $45,000 claim, negative Net Certified (legacy: −$2,250 / $47,025 = amount × (1−rate/100) × 1.1) | n/a (port bug found in 2026-07-08 audit) | Closed session R0 — percent unit kept in data (matches legacy + `sw_state_v1` migration), calc fixed via `claimRetention`/`claimNetCertified` helpers; ClaimsTab + both print routes rewired; :8766 row values pinned by unit tests and verified in-browser | **Critical** | ✅ |

## Gap 12 — per-tab enumeration (audited 2026-07-08)

Legacy-only content the port dropped, tab by tab. "Additive" = port-only, keep. Screenshot evidence: `sitework/parity-shots/<name>--legacy.png` vs `--vite.png`.

| Screen | Legacy has, port lacks | Port additive (keep) |
|---|---|---|
| Invoices | ✅ Closed R2 — `O1v2` transliterated: stat line, filter chips, Doc Ref + full cost-code + GST + Total-inc-GST columns, zebra rows, totals footer, legacy Comments-header quirk preserved bug-for-bug. Port's ID column dropped for column parity; DOCS flag + print icon kept (appended). `InvFormV2` gains Subcontractor select + Document Reference; amount label corrected to "Amount (ex GST)" | DOCS substantiation flag, per-row print icon |
| Purchase Orders | ✅ Closed R2 — `M1v2` transliterated: PO # / Doc Ref / description / full cost-code / GST / Total-inc-GST columns, zebra, totals footer, inline RECEIVE on any non-received/cancelled PO, "+ Create PO". `POFormV2` transliterated (subcontractor auto-fill, docRef, GST preview strip, poNum auto-number, no status field — new POs start `pending` per legacy) | DATE column |
| Progress Claims | ✅ Closed R2 — `Cl1` transliterated: "claimed of contract" sub-line, 3 stat blocks, Claim/Due Date naming, GST + Total-inc-GST columns, zebra, totals footer ($289,022 matches :8766) | Retention cert button, DOCS flag, print icon |
| Variations | ✅ Closed R6 — see gap 4 | — |
| PC & PS | ✅ Closed R6 — see gap 5 (maths fixed in R0) | — |
| Timesheets | ✅ Closed R7 — `U1`+`C1` transliterated (cost-code column, sub-line, 8h/$95/hr units, Log Time form) | — |
| Defects | ✅ Closed R7 — `k1v2` transliterated INCLUDING the `k1` **Retention & FFC** module the port never had (summary + purple progress bar + completion timeline + Issue FFC Certificate); checklist w/ pills, rectified dates, Edit links, DefectForm aligned (In Progress status) | — |
| Schedule | ✅ Closed R7 — `_1`+`S1` transliterated (green progress bar, SVG status dots, Edit links, Save Milestone form) | — |
| RFI Register | ✅ Closed R7 — `RF1`+`RFIForm1` transliterated (overdue pink sub-line + row tint, Responded date column, Edit links, full form) | — |
| Client Selections | ✅ Closed R7 — `N1`+`T1` transliterated (awaiting-decision sub-line, note lines, Approve on open+pending, list panels, add + approve dialogs) | — |
| Site Diary | ✅ Closed R7 — `R1`+`A1` transliterated (date-block cards, incident borders/tags, sub chips, sub-line, New Diary Entry form w/ sub toggles) | — |
| Calendar | ✅ Closed R7 — `Calx` transliterated (events counter, mono month groups, date-first rows, EXPIRED/≤30d pills, certificate expiries) | — |
| Clients | ✅ Closed R5 — `L1` transliterated: CLIENT / CONTACT / mono ABN / PROJECTS table, expand-in-place row detail (Phone/Email/ABN/Address + Edit Client ghost) | — |
| Subcontractors | ✅ Closed R5 — `V1` transliterated: compliance sub-line, uppercase trade chips, six columns (mono LICENCE, bare-text PL/WC statuses w/ dates, SWMS On file/Required), lilac non-compliant row tint, 60-day expiry window, "+ Add Subcontractor". Pill drift fixed (gap-10 note resolved) | — |
| Estimating | ✅ Closed R5 — `H1` transliterated: "N estimates · N won" sub-line, "+ New Estimate" (`h1` form ported), underline tabs w/o counts, sell-price totals (legacy AUD mixed-precision rendering: $172,500 / $634,146.34), estimate drill-in (Cost Budget / Contract / GST stats, codes table, `b1` Add Code, Edit, Promote); PROMOTE_ESTIMATE transliterated to `Z1` (named after estimate, settings defaults, Σ-budget estimatedValue, flips won) | — |
| Open Book | ✅ Closed R7 — `Obx` anatomy transliterated (eyebrow, generated line, boxed cards, six legacy section titles, claims totals, retention kvs, footer note; values per R0) | — |
| Client modal | ✅ Closed R7 — `m1` labels + stacked layout + "Save Client" (Cancel kept, additive) | Cancel button, required asterisk |

At parity per this sweep (no action): Projects list (incl. amount accent colours, verified computed rgb), Dashboard layout, Splash, Schedule/Diary/Calendar **content**, client modal fields.

## Confirmed at parity (audited — do not re-port)

Cost-plus substantiation gate (`src/lib/substantiation.ts`), claims numbering, sub certificates + expiry chips, all 4 print routes, leads convert-to-project modal, estimating templates flow, estimate edit, Xero badge + avatar→Settings, Materials/Suppliers at direct URLs (never in sidebar — matches legacy), Projects list, Dashboard layout, client modal fields, Site Diary / Schedule / Calendar content.

*(2026-07-04 claims corrected by the 2026-07-08 re-audit: the financial spine's **tables** carry gaps — see gap 12 — and "retention maths" is wrong in the Claims display, see gap 18. Overview/Cash Flow structure: gaps 13/14.)*

Additive Vite-only work (no legacy counterpart, keep): Phase 4.5-A reliability guardrails — ErrorBoundary, persist-failure banner, JSON backup/restore, collision-safe IDs (PR #34).

## Rebuild sessions (per Jake 2026-07-08 — replaces the P2–P7 restoration plan)

The port's reinterpreted screens are rebuilt from the legacy source under the transliteration protocol. What survives from the current codebase (proven faithful in the 2026-07-08 audit — do not re-port): the toolchain and infrastructure (router, StateProvider/reducer/persistence, 4.5-A guardrails), the PV design system + `Splash.tsx`, P1's `ProjectForm.tsx` + `src/lib/statutory.ts`, and the screens verified at parity (Projects list, Dashboard layout, client modal, Diary/Schedule/Calendar content).

| Session | Scope | Closes gaps | Status |
|---------|-------|-------------|--------|
| P1 | Project form + statutory validation (`src/lib/statutory.ts` + ProjectForm + e2e) — gap 1 | 1 | ✅ 2026-07-05 |
| PV | Visual parity — design system, splash, dashboard layout | 7, 10, 11 | ✅ 2026-07-06 |
| R0 | **Financial semantics core** — legacy money maths transliterated into `computeFinancials.ts`; retention units bug; unit tests pin legacy's exact on-screen numbers | 17, 18 | ✅ 2026-07-08 |
| R1 | Project Overview (`D1`) + BOQ edit tab (`w1`/`p1`) | 13, 16, 8a, 9 | ✅ 2026-07-08 |
| R2 | Money tables: Invoices (`O1v2`) / POs (`M1v2`, incl. RECEIVE) / Claims (`Cl1`) columns, filters, footers + both forms transliterated | 12 (3 rows) | ✅ 2026-07-09 |
| R3 | Cash Flow (`j1v2`): stat blocks, chart, month table, forward forecast | 14, 8b | ✅ 2026-07-09 |
| R4 | Settings (`St1`) + Reset to Demo Data + wire `sw_ct`/`sw_state` defaults into ProjectForm | 2, 3 | ✅ 2026-07-10 |
| R5 | Leads kanban (`G1`) + Estimating (`H1`) + Clients (`L1`) / Subs (`V1`) tables incl. bare-text badge fix; convert-lead + promote-estimate flows transliterated to `Z1` | 15, 12 (3 rows) | ✅ 2026-07-10 |
| R6 | Variation requestedBy (`v1` form + `B1` table) + PC/PS add/edit forms (`pcf`/`psf`) + Pcps anatomy | 4, 5, 12 (2 rows) | ✅ 2026-07-10 |
| R7 | Remaining tab anatomy: Schedule / Diary / RFIs / Selections / Timesheets / Defects (incl. the `k1` Retention & FFC module) / Calendar / Open Book / client modal | 12 (rest) | ✅ 2026-07-11 |
| R8 | Help & Education content (0-G) + full 26-pair sweep + DUPLICATE_PROJECT decision + sign-off | 6, 9 | ⬜ |

R0 runs first because every screen reads the money layer — rebuilding screens on wrong maths would mean re-verifying them all later.

After R8: resume Phase 4.5 B–F (ROADMAP), then the design phase (NB Akademie / pixel→glyph) on a complete app.
