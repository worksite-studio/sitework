import type { ProgressClaimId } from './ids'
import type { ProgressClaimStatus } from './enums'
import type { FileAttachment } from './file'

/**
 * Progress claim — per-project-keyed: `state.claims[projectId][]`.
 *
 * Cost-plus projects gate save on at least one `supportingDocs[]` entry
 * (Phase 1.5-A). Fixed-price projects do not require docs.
 *
 * `claimNo` added session 28 — sequential per project; required so the
 * Cl1 list cell renders correctly (positional fallback handles bad
 * pre-session-28 records).
 *
 * madeUnderSOPAct / sopActState added Phase 0-H.
 */
export interface ProgressClaim {
  id: ProgressClaimId
  /** Sequential per project. */
  claimNo: number
  desc: string
  date: string
  due: string
  amount: number
  status: ProgressClaimStatus
  notes: string
  madeUnderSOPAct: boolean
  sopActState: string
  /** Required for cost-plus projects (Phase 1.5-A). */
  supportingDocs?: FileAttachment[]
  /** Seed-only edge case flag (Phase 2 §3.21 seed). */
  retentionReleased?: boolean
  /** Seed-only edge case flag. */
  gstOnly?: boolean
}
