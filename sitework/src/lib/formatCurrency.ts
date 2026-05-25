/**
 * Whole-dollar currency formatter, matches the legacy `k()` helper from the
 * single-file app. Returns e.g. "$12,345" / "-$2,500". Rounds to nearest dollar.
 *
 * Phase 4 port. Future: a `formatCurrencyCents()` variant for line-item precision.
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount)
  const abs = Math.abs(rounded).toLocaleString('en-AU')
  return rounded < 0 ? `-$${abs}` : `$${abs}`
}
