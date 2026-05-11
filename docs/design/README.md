# Design

Aesthetic direction, type system, and design assets for SITEWORK. Living document — the aesthetic refresh is multi-session and ongoing.

## Reference brief

**M35** (m35.com.au) — the cross-pollination reference. Specifically:

- **Icebergs** — tidal device, unifying concept.
- **This Way Up** — motion-first identity language.
- **Neue Pixel** — proprietary typographic system.

Goal: borrow the discipline (signature device, motion-first feel, proprietary feel of the type) without copying surface treatment.

## Locked decisions

These are settled. Future work assumes them.

### Type system

- **NB Akademie Edition** (Neubau) — UI body type. Replaces Inter + JetBrains Mono; NB Akademie has same-family mono cuts, so one family covers proportional and mono use.
- **NB Form Std** (Neubau, Stefan Gandl) — splash, wordmark, editorial moments. Distinct from body, used sparingly for impact.

No webfont licence purchased yet. Spec-first; licence when direction is locked end-to-end.

### Landing screen

**Pixel → glyph wordmark build** on splash. Direct application of Neue Pixel × This Way Up — the wordmark resolves from a pixel grid as the user enters.

## Open threads

Carry into the next design session. Don't write code or buy fonts until these resolve.

1. **Pixel → glyph animation mechanics.** Grid resolution, timing curve, end state, transition into app chrome. Currently underspecified.
2. **NB Form placement beyond splash.** Where else it earns its keep — module covers, print outputs, hero numbers, status moments. Risk of overuse if it leaks into UI body.
3. **Colour discipline.** Proposed cut: drop `#EC4899`, `#8B5CF6`, `#7C3AED`. Replace with black + white + one warm neutral (clay or sand) + one signal accent (hi-vis yellow / surveyor orange / red). Status semantics partly shift from colour to typographic treatment (weight, case, italic).
4. **Wordmark.** Set in NB Form Std as-is, or commission a custom drawing that the pixel build resolves into?
5. **Print/PDF outputs.** Treat as a distinct branded surface — invoices, progress claims, quotes — with their own type/colour rules anchored to NB Form Std.

## Working notes

Full ideation history is parked in `~/.claude/plans/i-want-to-look-mutable-gizmo.md` (local, outside the repo). When the next design session resumes, pull from there.

## What goes in this folder

- This README — locked decisions and open threads.
- HTML or image mockups when a thread resolves to a visual artefact (e.g. `splash-mockup.html` once the animation mechanics are locked).
- Type specimens, colour cards, brand sheet.
- Reference screenshots from M35 etc., with attribution.

## Out of scope here

- Component-level CSS — that lives in `index.html`.
- Runtime icons, illustrations — until the system is locked, ad-hoc inline SVG in `index.html` is fine.
