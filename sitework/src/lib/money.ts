/**
 * Central money helpers — Phase 4.5-B (Money correctness).
 *
 * Before this module, GST arithmetic (`× 0.1`, `× 1.1`) was hand-inlined at a
 * dozen render sites and every amount field parsed input with the fragile
 * `Number(e.target.value) || 0` idiom (which silently swallows "$1,000" and
 * any other formatted input as 0). This centralises both, with cents rounding
 * to avoid binary-float drift.
 *
 * NOT a cents migration — amounts stay as JS numbers of dollars; Phase 5 moves
 * to integer cents in Postgres. The helpers here only guarantee that derived
 * values (GST, totals) are rounded to whole cents so display never shows a
 * float artefact like 110.00000000000001.
 *
 * The GST expressions mirror the legacy `Cl1`/`O1v2`/`M1v2` maths (`amount ×
 * 0.1` and `amount × 1.1`) so parity numbers are preserved exactly for the
 * whole-dollar seed data; the only change is the trailing cents round.
 */

/** Australian GST rate — 10%. */
export const GST_RATE = 0.1

/**
 * Round to whole cents, killing binary-float drift (e.g. 0.1 + 0.2, or the
 * 1.005 → 100.4999… midpoint that naive `Math.round(x*100)/100` rounds *down*).
 * A sub-cent bias (1e-9, seven orders of magnitude below a cent) nudges true
 * half-cent values to round half-away-from-zero without disturbing any genuine
 * non-midpoint amount.
 */
export function roundCents(amount: number): number {
  const bias = amount >= 0 ? 1e-9 : -1e-9
  return Math.round((amount + bias) * 100) / 100
}

/** GST component of an ex-GST amount — legacy `× 0.1`, cents-rounded. */
export function gstOf(exGst: number): number {
  return roundCents(exGst * GST_RATE)
}

/** Total including GST for an ex-GST amount — legacy `× 1.1`, cents-rounded. */
export function incGst(exGst: number): number {
  return roundCents(exGst * (1 + GST_RATE))
}

/**
 * Parse a user-entered amount to a number, tolerating currency formatting
 * ("$1,000", " 2 500 ") and returning `fallback` for empty or non-numeric
 * input. Replaces the scattered `Number(x) || 0` / `parseFloat(x) || 0` idiom,
 * which returned 0 for any string containing a `$` or `,` — silently discarding
 * what the user typed.
 */
export function parseAmount(input: string | number | null | undefined, fallback = 0): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : fallback
  if (input == null) return fallback
  const cleaned = input.replace(/[$,\s]/g, '')
  if (cleaned === '') return fallback
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : fallback
}
