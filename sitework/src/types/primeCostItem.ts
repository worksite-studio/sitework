import type { PrimeCostItemId } from './ids'
import type { PrimeCostItemStatus } from './enums'

/**
 * Prime Cost item — per-project-keyed: `state.primeCostItems[projectId][]`.
 *
 * Added Phase 1.5 item 1. When actualCost > allowance, margin applies only
 * to the excess (cost-plus reconciliation rule from CONTRACTS_REFERENCE.md
 * §7.4).
 */
export interface PrimeCostItem {
  id: PrimeCostItemId
  description: string
  /** $ ex GST — contractual allowance. */
  allowance: number
  /** Typically 0.20 (20%). */
  marginRate: number
  /** Reconciled actual cost; starts at 0. */
  actualCost: number
  status: PrimeCostItemStatus
}
