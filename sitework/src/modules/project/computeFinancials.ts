import type { Project, RootState } from '@/types'

/**
 * Project-level financial calculations consumed by the Overview tab,
 * the BOQ tab's footer, and the PC&PS reconciliation table. Pure so the
 * numbers are unit-testable in isolation.
 */

export interface ProjectFinancials {
  /** Sum of every cost code's budget — the original contract sum. */
  originalBudget: number
  /** Sum of approved variations. */
  approvedVariations: number
  /** originalBudget + approvedVariations. */
  adjustedContractValue: number
  /** Sum of every cost code's actual (invoices paid). */
  costToDate: number
  /** Sum of every cost code's committed (POs raised). */
  committedToDate: number
  /** adjustedContractValue - costToDate — what's still in the project. */
  remainingContract: number
  /** (adjustedContractValue - costToDate) / adjustedContractValue × 100 — live margin. */
  currentMarginPct: number
  /** Live margin - target margin. */
  marginErosionPct: number
  /** Project is fixed-price: substantiation / margin treatment differs. */
  isFixedPrice: boolean
}

export function computeProjectFinancials(project: Project): ProjectFinancials {
  const originalBudget = project.codes.reduce((s, c) => s + (c.budget || 0), 0)
  const approvedVariations = project.variations
    .filter((v) => v.status === 'Approved')
    .reduce((s, v) => s + (v.amount || 0), 0)
  const adjustedContractValue = originalBudget + approvedVariations

  const costToDate = project.codes.reduce((s, c) => s + (c.actual || 0), 0)
  const committedToDate = project.codes.reduce((s, c) => s + (c.committed || 0), 0)
  const remainingContract = adjustedContractValue - costToDate

  const currentMarginPct =
    adjustedContractValue > 0
      ? ((adjustedContractValue - costToDate) / adjustedContractValue) * 100
      : 0
  const marginErosionPct = currentMarginPct - (project.margin || 0)

  return {
    originalBudget,
    approvedVariations,
    adjustedContractValue,
    costToDate,
    committedToDate,
    remainingContract,
    currentMarginPct,
    marginErosionPct,
    isFixedPrice: project.contractType === 'fixed-price',
  }
}

/**
 * Sum of outstanding invoice amounts on this project (Approved + Pending).
 * Used by the Overview tab's KPI row.
 */
export function outstandingInvoiceTotal(project: Project): number {
  return project.invoices
    .filter((i) => i.status === 'Approved' || i.status === 'Pending')
    .reduce((s, i) => s + (i.amount || 0), 0)
}

/**
 * Retention currently held for this project (from state.retention[projectId]).
 */
export function retentionHeld(state: RootState, projectId: string): number {
  const r = state.retention[projectId]
  return r?.held ?? 0
}
