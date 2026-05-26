/**
 * Retention — per-project-keyed: `state.retention[projectId]` (single record,
 * not an array).
 *
 * Optional in seed for some projects; consumers should default missing
 * records to `{ rate: 0.05, held: 0, released: 0 }`.
 */
export interface Retention {
  /** Decimal — typically 0.05 (5%). */
  rate: number
  held?: number
  released?: number
}
