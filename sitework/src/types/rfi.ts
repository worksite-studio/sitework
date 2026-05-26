import type { RfiId } from './ids'
import type { RfiStatus } from './enums'

/**
 * RFI — per-project-keyed: `state.rfis[projectId][]`.
 *
 * `rfiNo` is sequential per project (same pattern as ProgressClaim.claimNo).
 *
 * ARCHITECTURE.md §6.13 notes no dedicated reducer actions — Phase 4 adds
 * ADD_RFI / UPDATE_RFI in Session 3.
 */
export interface Rfi {
  id: RfiId
  rfiNo: number
  subject: string
  addressee: string
  dateIssued: string
  dateRequired: string
  dateResponded: string | null
  response: string
  status: RfiStatus
}
