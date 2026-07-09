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

/**
 * Two-decimal variant — matches the legacy `K0()` helper (line-item rates,
 * cents-precision amounts). Returns e.g. "$95.00" / "-$12,345.67".
 */
export function formatCurrencyExact(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return amount < 0 ? `-$${abs}` : `$${abs}`
}
