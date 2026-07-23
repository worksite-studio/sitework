/**
 * Discriminated union of all reducer actions. Adding a new action: extend
 * this union AND add a `case` arm in reducer.ts — TypeScript's exhaustiveness
 * check (the `assertNever` call at the bottom of the reducer switch) will
 * flag any missing handlers at compile time.
 *
 * 53 actions total — 44 ported verbatim from the legacy `Z1` reducer plus
 * 9 new actions filling the gaps noted in ARCHITECTURE.md §6.13
 * (ADD_MILESTONE, UPDATE_MILESTONE, ADD_RFI, UPDATE_RFI, ADD_MATERIAL,
 *  UPDATE_MATERIAL, ADD_SUPPLIER, UPDATE_SUPPLIER, UPDATE_SETTINGS).
 */

import type {
  BoqTemplateId,
  Client,
  ClientId,
  Estimate,
  CostCode,
  CostCodeId,
  DefectId,
  DiaryEntry,
  Defect,
  EstimateCode,
  EstimateId,
  Invoice,
  InvoiceId,
  Lead,
  LeadId,
  LineItem,
  LineItemId,
  Material,
  MaterialId,
  Milestone,
  MilestoneId,
  ScheduleTask,
  ScheduleTaskId,
  PrimeCostItem,
  PrimeCostItemId,
  ProgressClaim,
  ProgressClaimId,
  Project,
  ProjectId,
  ProvisionalSum,
  ProvisionalSumId,
  Purchase,
  PurchaseId,
  Retention,
  Rfi,
  RfiId,
  RootState,
  Selection,
  SelectionId,
  Settings,
  Subcontractor,
  SubcontractorId,
  Supplier,
  SupplierId,
  Timesheet,
  TimesheetId,
  Variation,
  VariationId,
} from '@/types'

// ─── Projects ────────────────────────────────────────────────────────────

export type AddProjectAction = { type: 'ADD_PROJECT'; project: Project }
export type UpdateProjectAction = {
  type: 'UPDATE_PROJECT'
  projectId: ProjectId
  patch: Partial<Project>
}
export type DuplicateProjectAction = {
  type: 'DUPLICATE_PROJECT'
  projectId: ProjectId
  newName: string
}

// ─── Cost codes (nested in Project) ──────────────────────────────────────

export type AddCodeAction = { type: 'ADD_CODE'; projectId: ProjectId; code: CostCode }
export type UpdateCodeAction = {
  type: 'UPDATE_CODE'
  projectId: ProjectId
  codeId: CostCodeId
  patch: Partial<CostCode>
}
export type DeleteCodeAction = { type: 'DELETE_CODE'; projectId: ProjectId; codeId: CostCodeId }
export type MoveCodeUpAction = { type: 'MOVE_CODE_UP'; projectId: ProjectId; codeId: CostCodeId }
export type MoveCodeDownAction = {
  type: 'MOVE_CODE_DOWN'
  projectId: ProjectId
  codeId: CostCodeId
}
export type ImportTemplateIntoBoqAction = {
  type: 'IMPORT_TEMPLATE_INTO_BOQ'
  projectId: ProjectId
  templateId: BoqTemplateId
}

// ─── Line items (nested under CostCode) ──────────────────────────────────

export type AddLineItemAction = {
  type: 'ADD_LINE_ITEM'
  projectId: ProjectId
  ccId: CostCodeId
  lineItem: LineItem
}
export type UpdateLineItemAction = {
  type: 'UPDATE_LINE_ITEM'
  projectId: ProjectId
  ccId: CostCodeId
  lineItemId: LineItemId
  patch: Partial<LineItem>
}
export type DeleteLineItemAction = {
  type: 'DELETE_LINE_ITEM'
  projectId: ProjectId
  ccId: CostCodeId
  lineItemId: LineItemId
}

// ─── Variations ──────────────────────────────────────────────────────────

export type AddVariationAction = {
  type: 'ADD_VARIATION'
  projectId: ProjectId
  variation: Variation
}
export type UpdateVariationAction = {
  type: 'UPDATE_VARIATION'
  projectId: ProjectId
  variationId: VariationId
  patch: Partial<Variation>
}

// ─── Invoices ────────────────────────────────────────────────────────────

export type AddInvoiceAction = { type: 'ADD_INVOICE'; projectId: ProjectId; invoice: Invoice }
export type UpdateInvoiceAction = {
  type: 'UPDATE_INVOICE'
  projectId: ProjectId
  invoiceId: InvoiceId
  patch: Partial<Invoice>
}

// ─── Purchases / POs ─────────────────────────────────────────────────────

export type AddPurchaseAction = {
  type: 'ADD_PURCHASE'
  projectId: ProjectId
  purchase: Purchase
}
export type UpdatePurchaseAction = {
  type: 'UPDATE_PURCHASE'
  projectId: ProjectId
  purchaseId: PurchaseId
  patch: Partial<Purchase>
}
export type ReceivePurchaseAction = {
  type: 'RECEIVE_PURCHASE'
  projectId: ProjectId
  purchaseId: PurchaseId
  receivedDate: string
}

// ─── Progress claims ─────────────────────────────────────────────────────

export type AddClaimAction = { type: 'ADD_CLAIM'; projectId: ProjectId; claim: ProgressClaim }
export type UpdateClaimAction = {
  type: 'UPDATE_CLAIM'
  projectId: ProjectId
  claimId: ProgressClaimId
  patch: Partial<ProgressClaim>
}

// ─── PC / PS items ───────────────────────────────────────────────────────

export type AddPcItemAction = { type: 'ADD_PC_ITEM'; projectId: ProjectId; item: PrimeCostItem }
export type UpdatePcItemAction = {
  type: 'UPDATE_PC_ITEM'
  projectId: ProjectId
  itemId: PrimeCostItemId
  patch: Partial<PrimeCostItem>
}
export type DeletePcItemAction = {
  type: 'DELETE_PC_ITEM'
  projectId: ProjectId
  itemId: PrimeCostItemId
}

export type AddPsItemAction = { type: 'ADD_PS_ITEM'; projectId: ProjectId; item: ProvisionalSum }
export type UpdatePsItemAction = {
  type: 'UPDATE_PS_ITEM'
  projectId: ProjectId
  itemId: ProvisionalSumId
  patch: Partial<ProvisionalSum>
}
export type DeletePsItemAction = {
  type: 'DELETE_PS_ITEM'
  projectId: ProjectId
  itemId: ProvisionalSumId
}

// ─── Retention ───────────────────────────────────────────────────────────

export type UpdateRetentionAction = {
  type: 'UPDATE_RETENTION'
  projectId: ProjectId
  patch: Partial<Retention>
}

// ─── Diary / Defects / Selections / Timesheets ───────────────────────────

export type AddDiaryEntryAction = {
  type: 'ADD_DIARY_ENTRY'
  projectId: ProjectId
  entry: DiaryEntry
}
export type AddDefectAction = { type: 'ADD_DEFECT'; projectId: ProjectId; defect: Defect }
export type UpdateDefectAction = {
  type: 'UPDATE_DEFECT'
  projectId: ProjectId
  defectId: DefectId
  patch: Partial<Defect>
}
export type AddSelectionAction = {
  type: 'ADD_SELECTION'
  projectId: ProjectId
  selection: Selection
}
export type ApproveSelectionAction = {
  type: 'APPROVE_SELECTION'
  projectId: ProjectId
  selectionId: SelectionId
  approvedOption: string
}
export type AddTimesheetAction = {
  type: 'ADD_TIMESHEET'
  projectId: ProjectId
  timesheet: Timesheet
}
export type DeleteTimesheetAction = {
  type: 'DELETE_TIMESHEET'
  projectId: ProjectId
  timesheetId: TimesheetId
}

// ─── Milestones (new in Phase 4 — see ARCHITECTURE.md §6.13) ─────────────

export type AddMilestoneAction = {
  type: 'ADD_MILESTONE'
  projectId: ProjectId
  milestone: Milestone
}
export type UpdateMilestoneAction = {
  type: 'UPDATE_MILESTONE'
  projectId: ProjectId
  milestoneId: MilestoneId
  patch: Partial<Milestone>
}

// ─── Programme of works (4.7-O) ──────────────────────────────────────────

export type AddScheduleTaskAction = {
  type: 'ADD_SCHEDULE_TASK'
  projectId: ProjectId
  task: ScheduleTask
}
export type UpdateScheduleTaskAction = {
  type: 'UPDATE_SCHEDULE_TASK'
  projectId: ProjectId
  taskId: ScheduleTaskId
  patch: Partial<ScheduleTask>
}
export type DeleteScheduleTaskAction = {
  type: 'DELETE_SCHEDULE_TASK'
  projectId: ProjectId
  taskId: ScheduleTaskId
}
/** Snapshot the current computed dates as the approved baseline (4.7-R). */
export type SetScheduleBaselineAction = {
  type: 'SET_SCHEDULE_BASELINE'
  projectId: ProjectId
  /** taskId → the dates to freeze. Tasks absent from the map are untouched. */
  baselines: Record<string, { start: string; end: string }>
}

// ─── RFIs (new in Phase 4) ───────────────────────────────────────────────

export type AddRfiAction = { type: 'ADD_RFI'; projectId: ProjectId; rfi: Rfi }
export type UpdateRfiAction = {
  type: 'UPDATE_RFI'
  projectId: ProjectId
  rfiId: RfiId
  patch: Partial<Rfi>
}

// ─── Subs / Clients / Leads ──────────────────────────────────────────────

export type AddSubAction = { type: 'ADD_SUB'; sub: Subcontractor }
export type UpdateSubAction = {
  type: 'UPDATE_SUB'
  subId: SubcontractorId
  patch: Partial<Subcontractor>
}

export type AddClientAction = { type: 'ADD_CLIENT'; client: Client }
export type UpdateClientAction = {
  type: 'UPDATE_CLIENT'
  clientId: ClientId
  patch: Partial<Client>
}

export type AddLeadAction = { type: 'ADD_LEAD'; lead: Lead }
export type UpdateLeadAction = { type: 'UPDATE_LEAD'; leadId: LeadId; patch: Partial<Lead> }
export type ConvertLeadToProjectAction = {
  type: 'CONVERT_LEAD_TO_PROJECT'
  leadId: LeadId
  /** Client for the new project — legacy `Cv1` allows "(no client)". */
  clientId: ClientId | null
}

// ─── Materials / Suppliers (new in Phase 4) ──────────────────────────────

export type AddMaterialAction = { type: 'ADD_MATERIAL'; material: Material }
export type UpdateMaterialAction = {
  type: 'UPDATE_MATERIAL'
  materialId: MaterialId
  patch: Partial<Material>
}
export type AddSupplierAction = { type: 'ADD_SUPPLIER'; supplier: Supplier }
export type UpdateSupplierAction = {
  type: 'UPDATE_SUPPLIER'
  supplierId: SupplierId
  patch: Partial<Supplier>
}

// ─── Estimates ───────────────────────────────────────────────────────────

export type AddEstimateAction = { type: 'ADD_ESTIMATE'; estimate: Estimate }
export type UpdateEstimateAction = {
  type: 'UPDATE_ESTIMATE'
  estimateId: EstimateId
  patch: Partial<Estimate>
}
export type AddEstCodeAction = {
  type: 'ADD_EST_CODE'
  estimateId: EstimateId
  code: EstimateCode
}
export type CreateEstimateFromTemplateAction = {
  type: 'CREATE_ESTIMATE_FROM_TEMPLATE'
  templateId: BoqTemplateId
  name: string
  /** Used to compute absolute budgets from template percentages. */
  contractValue: number
}
// Legacy Z1 names the promoted project after the estimate — no name param.
export type PromoteEstimateAction = {
  type: 'PROMOTE_ESTIMATE'
  estimateId: EstimateId
}

// ─── Settings (new in Phase 4) ───────────────────────────────────────────

export type UpdateSettingsAction = { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }

// ─── Backup restore (Phase 4.5-A) ────────────────────────────────────────

/**
 * Replace the entire root state with a parsed backup file. The payload has
 * already been validated + merged onto the seed shape by
 * `parseBackupFile()`. Removed in Phase 5 when restore goes server-side.
 */
export type RestoreStateAction = { type: 'RESTORE_STATE'; state: RootState }

// ─── Union ───────────────────────────────────────────────────────────────

export type Action =
  | AddProjectAction
  | UpdateProjectAction
  | DuplicateProjectAction
  | AddCodeAction
  | UpdateCodeAction
  | DeleteCodeAction
  | MoveCodeUpAction
  | MoveCodeDownAction
  | ImportTemplateIntoBoqAction
  | AddLineItemAction
  | UpdateLineItemAction
  | DeleteLineItemAction
  | AddVariationAction
  | UpdateVariationAction
  | AddInvoiceAction
  | UpdateInvoiceAction
  | AddPurchaseAction
  | UpdatePurchaseAction
  | ReceivePurchaseAction
  | AddClaimAction
  | UpdateClaimAction
  | AddPcItemAction
  | UpdatePcItemAction
  | DeletePcItemAction
  | AddPsItemAction
  | UpdatePsItemAction
  | DeletePsItemAction
  | UpdateRetentionAction
  | AddDiaryEntryAction
  | AddDefectAction
  | UpdateDefectAction
  | AddSelectionAction
  | ApproveSelectionAction
  | AddTimesheetAction
  | DeleteTimesheetAction
  | AddMilestoneAction
  | UpdateMilestoneAction
  | AddScheduleTaskAction
  | UpdateScheduleTaskAction
  | DeleteScheduleTaskAction
  | SetScheduleBaselineAction
  | AddRfiAction
  | UpdateRfiAction
  | AddSubAction
  | UpdateSubAction
  | AddClientAction
  | UpdateClientAction
  | AddLeadAction
  | UpdateLeadAction
  | ConvertLeadToProjectAction
  | AddMaterialAction
  | UpdateMaterialAction
  | AddSupplierAction
  | UpdateSupplierAction
  | AddEstimateAction
  | UpdateEstimateAction
  | AddEstCodeAction
  | CreateEstimateFromTemplateAction
  | PromoteEstimateAction
  | UpdateSettingsAction
  | RestoreStateAction

/**
 * Compile-time exhaustiveness check. Call from the default arm of a switch
 * over `Action` — if a new action type is added without a case arm, TS
 * complains here.
 */
export function assertNever(x: never): never {
  throw new Error(`Unhandled action: ${JSON.stringify(x)}`)
}
