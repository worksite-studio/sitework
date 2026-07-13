import type { CostCodeId, PurchaseId } from './ids'
import type { PurchaseStatus } from './enums'

/**
 * Purchase / PO — per-project-keyed: `state.purchases[projectId][]`.
 */
export interface Purchase {
  id: PurchaseId
  /** Display number, legacy `POFormV2`: "PO-001" style. Falls back to id. */
  poNum?: string
  ccId: CostCodeId
  /** Supplier *name* — Phase 5 normalises to a SupplierId FK. */
  supplier: string
  /** Linked subcontractor (legacy subId) — takes display precedence over supplier. */
  subId?: string | null
  /** External document reference (legacy field, shown in the PO table). */
  docRef?: string
  desc: string
  amount: number
  status: PurchaseStatus
  date: string
  dueDate: string
  receivedDate: string | null
  notes: string
}
