import type { CostCodeId, PurchaseId } from './ids'
import type { PurchaseStatus } from './enums'

/**
 * Purchase / PO — per-project-keyed: `state.purchases[projectId][]`.
 */
export interface Purchase {
  id: PurchaseId
  ccId: CostCodeId
  /** Supplier *name* — Phase 5 normalises to a SupplierId FK. */
  supplier: string
  desc: string
  amount: number
  status: PurchaseStatus
  date: string
  dueDate: string
  receivedDate: string | null
  notes: string
}
