# Finance model

The preliminary finance model spreadsheets that SITEWORK is being built from. Treated as a **spec document being absorbed into the app**, not a permanent fixture.

## Current files

| File | Status | Notes |
|---|---|---|
| [`Preliminary_Finance_Model_v8.xlsx`](Preliminary_Finance_Model_v8.xlsx) | **Current** | Active spec. Requires refinement inside the prototype — see `parity-audit.md`. |
| [`Preliminary_Finance_Model_v6.xlsx`](Preliminary_Finance_Model_v6.xlsx) | Historical | Superseded by v8. Kept until parity audit confirms v8 fully supersedes; will be archived after that. |

## End-state plan

This folder is a **transitional home**. The xlsx files live here only while the prototype is catching up to v8. The phased plan:

- **Phase A — Parity audit.** Walk v8 sheet-by-sheet against `index.html`. Mark each line item as ✅ implemented, 🟡 partial, or ❌ missing. Findings live in [`parity-audit.md`](parity-audit.md).
- **Phase B — Implementation.** ❌ and 🟡 items become new ROADMAP phases. Build them into `index.html`.
- **Phase C — Decide end-state** once A and B are done:
  - **Archive** in `docs/archive/finance-model/` if the history is worth keeping but the app is now the source of truth (most likely outcome).
  - **Delete** if the app fully supersedes and no further model iteration is expected.
  - **Keep here** as a living spec if v9, v10 etc. are anticipated.

Until Phase C resolves, treat `index.html` and `v8.xlsx` as **mutually authoritative**: the app for what's built, v8 for what's still owed.
