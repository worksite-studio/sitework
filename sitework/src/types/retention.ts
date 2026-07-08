/**
 * Retention — per-project-keyed: `state.retention[projectId]` (single record,
 * not an array).
 *
 * Optional in seed for some projects; consumers should default missing
 * records to `{ rate: 5, held: 0, released: 0 }`.
 */
export interface Retention {
  /**
   * PERCENT, not a fraction — 5 means 5%. This is the legacy baseline's
   * stored unit (`Cl1`/`Obx` compute `amount * rate / 100`, default 5), and
   * `sw_state_v1` data migrated from the legacy app carries it. Convert via
   * `claimRetention()` / `retentionRatePct()` in computeFinancials — never
   * multiply by the raw rate. (PARITY gap 18: the pre-R0 port read this as a
   * fraction, inflating retention ×100.)
   */
  rate: number
  held?: number
  released?: number
}
