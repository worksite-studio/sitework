import type { CostCodeId, InvoiceId } from './ids'
import type { InvoiceStatus } from './enums'
import type { FileAttachment } from './file'

/**
 * Invoice — nested in Project.invoices[].
 *
 * `supportingDocs[]` added Phase 1.5-A — mandatory ≥1 entry for cost-plus
 * projects (substantiation gate enforced at save time, not in the type).
 *
 * madeUnderSOPAct / sopActState are Phase 5 targets (CONTRACTS_REFERENCE.md
 * §10) — not yet in app.
 */
export interface Invoice {
  id: InvoiceId
  ccId: CostCodeId
  /** Supplier *name* — Phase 5 normalises to a SupplierId FK. */
  supplier: string
  /** Linked subcontractor (legacy subId) — takes display precedence over supplier. */
  subId?: string | null
  /** External document reference (legacy field, shown in the invoices table). */
  docRef?: string
  /** Ex-GST — the tables derive GST (×0.1) and Total inc GST (×1.1) from it. */
  amount: number
  status: InvoiceStatus
  date: string
  due: string
  /** Pushed-to-Xero flag (Phase 6+ integration; currently mock). */
  xero: boolean
  /** Required for cost-plus projects (Phase 1.5-A). */
  supportingDocs?: FileAttachment[]
  // TODO: Phase 5 — add madeUnderSOPAct: boolean, sopActState: SopActState
}
