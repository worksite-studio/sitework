# PARITY.md — the baseline contract

> **The rule:** `legacy/index.html` (serve locally at **http://127.0.0.1:8766/**) is the **canonical baseline** for SITEWORK. It contains every feature built across sessions 0-A → 29. The Vite app at `sitework/` is a port of it — and the port is **incomplete**. Until every row in the gap table below is closed, no new feature work ships in the Vite app, and every session's acceptance test is a side-by-side check against :8766.

Start the baseline server:

```bash
cd legacy && python3 -m http.server 8766 --bind 127.0.0.1
```

The baseline also deploys with the app: every push to `main` publishes it at **https://sitework-eight.vercel.app/legacy** (wired in `vercel.json` — the build copies `legacy/index.html` into `dist/legacy/`; verified byte-identical 2026-07-04). Same file, same bytes, always up to date with the repo — use it when a local server isn't running. The Vite app deploys at https://sitework-eight.vercel.app/.

Why this file exists: on 2026-07-04 the port was caught being treated as the finished product. A full audit against the baseline found ~40 features ported faithfully and the gaps below silently dropped — including the entire project-creation form and its statutory compliance validation. This table is the single source of truth for what remains.

## Gap table (audit: 2026-07-04)

| # | Gap | Built in (legacy session) | Vite status | Severity | Closed |
|---|-----|---------------------------|-------------|----------|--------|
| 1 | Project create/edit form (`I0`) + statutory validation: VIC s.13 hard-block (red banner; Save stays clickable but refuses, matching legacy), QLD `qldHwsAcknowledged` checkbox, WA flag, deposit-cap helper under state select | 0-H (session 23) | Ported session P1 — `ProjectForm.tsx` + `src/lib/statutory.ts` (21 unit tests pin verbatim copy/thresholds) + 7 e2e specs. Note: legacy seeded defaults from `sw_ct`/`sw_state` Settings keys — wires up in P2 | Critical | ✅ |
| 2 | Settings: home state, 8 state-keyed builder licences, 5 insurance registrations (HBCF / DBI / VBA / QBCC / HII) | session 23 (`St1`) | Only 4 fields (userName / businessName / abn / licence) | Critical | ⬜ |
| 3 | Settings: Reset to Demo Data (red button + confirm + clear + reload) | session 24 | Missing (new Backup card is additive, not a replacement) | High | ⬜ |
| 4 | Variation `requestedBy` (Owner/Builder/Architect/Other, default Owner) + `reasonCategory` "Other" value + conditional comment fields | 0-H + session 26 | Field absent from type and form | High | ⬜ |
| 5 | PC/PS add/edit forms (`pcf` / `psf` with validation) | session 27 | Read + delete only; deferral admitted in PcPsTab comment | High | ⬜ |
| 6 | Help & Education: 4 tabs (Start / Modules / Glossary / Rawlinson), 3 getting-started guides, 6 module docs, 14-term glossary — all real content | 0-G (session 17) | `/education` is a Placeholder stub | Medium | ⬜ |
| 7 | Splash screen (`Lp`, "tap anywhere to enter") | original entry flow | Ported session PV — verbatim `Splash.tsx` (88px wordmark, lilac pixel grid), shows every full load, e2e-covered | Medium | ✅ |
| 8 | Session-26 visual fixes: Overview BOQ filters all-zero placeholder codes (44→25 rows); Cash Flow "$0 Committed" legend hidden when empty; Project Health "committed vs budget" descriptor | session 26 | Unverified — check each side-by-side vs :8766 | Medium | ⬜ |
| 9 | DUPLICATE_PROJECT — reducer action exists, no UI button | session 29 inventory | Action present, no button on ProjectsList | Low | ⬜ |
| 10 | **Visual design system** — the baseline's actual design language: horizontal top nav (uppercase, letterspaced) with spaced-caps SITEWORK wordmark (no sidebar), editorial stat blocks (large numbers over heavy black rules, colour accents: purple money / pink alerts / green-purple status dots), ruled list panels instead of rounded cards, "Good morning." display headline, legacy `d` colour + `v` type tokens | sessions 21, 26 + original design | Closed session PV — tokens repointed to legacy `d` verbatim; every primitive rewritten to baseline spec (underline inputs, square modals, bare-text badges, ink-ruled tables); top nav + 44px project sub-bar; 28 side-by-side screenshot pairs in `sitework/test-results/parity/` | **Critical** | ✅ |
| 11 | Dashboard layout parity — Alerts & Compliance list panel leads the page ("+N more alerts" overflow), "Good morning. / Here's where things stand today." heading block, Budget & Margin ruled column beside Project Health, KPI sublabels ("$0.7M contract value") | 0-A + session 26 | Closed session PV — Alerts & Compliance panel leads, greeting block, editorial stat blocks, Budget & Margin column restored, phantom H1 removed | High | ✅ |

| 12 | Per-table column/content parity — legacy tables carry richer content the port dropped (Invoices: Doc Ref, full cost-code descriptions, GST + Total inc GST columns, Comments, status filter chips, totals footer, header stat sub-line; similar deltas likely on other tabs). Styling is at parity; columns are not | sessions 0-D/0-E | Enumerate tab-by-tab in the P5 side-by-side sweep and close per-tab | High | ⬜ |

## Confirmed at parity (audited — do not re-port)

Financial spine (Overview/BOQ/Variations/Invoices/POs/Claims), cost-plus substantiation gate (`src/lib/substantiation.ts`), retention maths, claims numbering, sub certificates + expiry chips, Calendar tab, Open Book tab, all 4 print routes, leads convert-to-project modal, estimating templates flow, estimate edit, Xero badge + avatar→Settings, Materials/Suppliers at direct URLs (never in sidebar — matches legacy).

Additive Vite-only work (no legacy counterpart, keep): Phase 4.5-A reliability guardrails — ErrorBoundary, persist-failure banner, JSON backup/restore, collision-safe IDs (PR #34).

## Restoration sessions

| Session | Scope | Size | Status |
|---------|-------|------|--------|
| P1 | Project form + statutory validation (`src/lib/statutory.ts` + ProjectForm + e2e) — gap 1 | L | ✅ 2026-07-05 |
| PV | Visual parity — gaps 7, 10, 11 (see row above) | L | ✅ 2026-07-06 |
| P2 | Settings parity — gaps 2, 3 | M | ⬜ |
| P3 | Variation requestedBy + PC/PS forms — gaps 4, 5 | M | ⬜ |
| P4 | Help & Education content + splash port — gaps 6, 7 | M | ⬜ |
| P5 | Side-by-side sweep + DUPLICATE_PROJECT UI — gaps 8, 9 + full walkthrough | S | ⬜ |

After P5: resume Phase 4.5 B–F (ROADMAP), then the design phase (NB Akademie / pixel→glyph) on a complete app.
