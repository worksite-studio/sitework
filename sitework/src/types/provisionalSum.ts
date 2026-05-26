import type { ProvisionalSumId } from './ids'
import type { ProvisionalSumStatus } from './enums'

/**
 * Provisional Sum — per-project-keyed: `state.provisionalSums[projectId][]`.
 *
 * Added Phase 1.5 item 1. Same reconciliation rule as PrimeCostItem.
 */
export interface ProvisionalSum {
  id: ProvisionalSumId
  description: string
  allowance: number
  marginRate: number
  actualCost: number
  status: ProvisionalSumStatus
}
