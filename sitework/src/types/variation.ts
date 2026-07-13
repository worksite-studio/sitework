import type { CostCodeId, VariationId } from './ids'
import type { VariationReasonCategory, VariationRequestedBy, VariationStatus } from './enums'

/**
 * Variation — nested in Project.variations[].
 *
 * reasonCategory + timeImpactDays added Phase 0-H.
 * signedByOwner / signedByBuilder / workCommencedBeforeSignature are
 * Phase 5 targets (per CONTRACTS_REFERENCE.md §10) — not yet in app.
 */
export interface Variation {
  id: VariationId
  ccId: CostCodeId
  desc: string
  amount: number
  status: VariationStatus
  date: string
  reasonCategory: VariationReasonCategory
  timeImpactDays: number
  /** Who asked for it — legacy `v1`, default Owner (PARITY gap 4). */
  requestedBy?: VariationRequestedBy
  /** Shown when requestedBy === 'Other' — "Specify who requested this". */
  requestedByComment?: string
  /** Shown when reasonCategory === 'Other' — "Comment / Reason Detail". */
  reasonComment?: string
  // TODO: Phase 5 — add signedByOwner: string | null, signedByBuilder: string | null,
  //                  workCommencedBeforeSignature: boolean
}
