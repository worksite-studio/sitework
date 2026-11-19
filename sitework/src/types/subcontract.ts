import type { CostCodeId, ScopeLineId, SubcontractId, SubcontractorId } from './ids'
import type { SubcontractStatus } from './enums'

/**
 * One stage of a subcontract's scope, allocated to a BOQ cost code (4.8-E).
 *
 * A single trade is often engaged across several stages/cost centres of one
 * project (e.g. drainage, roofing, hydraulic). Each stage is a scope line the
 * awarder allocates to the matching cost code; the line amount is the ex-GST
 * value AWARDED for that stage.
 */
export interface ScopeLine {
  id: ScopeLineId
  /** Allocated BOQ cost code. */
  ccId: CostCodeId
  desc: string
  /** Ex-GST awarded value for this stage. */
  amount: number
  /**
   * Optional working-day duration for this stage. Stored now so the deferred
   * "Add to Program of Works" push can create dated tasks when a sub provides a
   * clean breakdown; absent lines become unscheduled placeholders.
   */
  durationDays?: number
}

/**
 * Subcontract agreement — per-project-keyed: `state.subcontracts[projectId]`.
 *
 * Captures a sub's WHOLE scope for a project in one record, alongside Purchase
 * Orders in the same tab. Stands alone — it does not issue or link child POs.
 *
 * The awarded total (Σ scope line amounts) is a FORWARD commitment reconciled
 * against the BOQ budget; it deliberately does NOT fold into the "committed to
 * date" figure (`codeDocTotals` / `computeProjectFinancials`), so the sub's
 * later invoices/POs aren't double-counted. Phase 5 normalises to the planned
 * `project_subcontractors` join table.
 */
export interface Subcontract {
  id: SubcontractId
  /** Which subcontractor (`state.subs`). */
  subId: SubcontractorId
  /** Agreement reference, e.g. "SC-001". */
  ref: string
  status: SubcontractStatus
  /** Award / agreement date (ISO yyyy-mm-dd). */
  date: string
  /** Scope lines — total awarded = Σ line.amount. */
  scope: ScopeLine[]
  notes?: string
}
