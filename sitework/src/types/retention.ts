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
  /**
   * Whether retention applies to this project's claims (4.7-I slice 2 —
   * retention is optional, not compulsory). `undefined`/`true` = applied
   * (back-compat: existing projects keep withholding); `false` = no retention,
   * so `retentionRatePct()` returns 0 and claims certify the full amount.
   */
  enabled?: boolean
  held?: number
  released?: number
  /** Adjusted contract value snapshot the retention was set against (legacy k1). */
  contractValue?: number
  /** Practical Completion date (ISO) — drives the k1 Completion Timeline. */
  pcDate?: string | null
  /** Final Financial Completion date (ISO) — set by "Issue FFC Certificate". */
  ffcDate?: string | null
  /** Defects liability period, months (legacy k1 "End of DLP"). */
  dlpMonths?: number
  notes?: string
}
