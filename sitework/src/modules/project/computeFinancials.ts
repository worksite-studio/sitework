import type { Project, Purchase, RootState } from '@/types'
import { gstOf, incGst } from '@/lib/money'

/**
 * Financial semantics core — transliterated from the legacy baseline
 * (`legacy/index.html`, modules `D1` / `D1v2` / `Cl1` / `Pcps` / `Obx` per
 * the ARCHITECTURE.md name map). PARITY.md session R0, gaps 17/18.
 *
 * Legacy is the spec: every formula here mirrors the legacy source exactly.
 * Do not "improve" the maths — a divergence from :8766 is a bug by
 * definition, however reasonable it looks.
 */

export interface ProjectFinancials {
  /** Σ codes.budget — legacy `D1` u / `Obx` totBudget. */
  originalBudget: number
  /**
   * budget ÷ (1 − margin/100) — margin is markup on sell, not on cost.
   * Legacy `D1` r / `D1v2` contract / `Cl1` cVal / `Obx` cv.
   */
  contractValue: number
  /** Σ variations[Approved].amount. */
  approvedVariations: number
  /** Σ variations[Pending].amount — legacy `Obx` varPending. */
  pendingVariations: number
  /** contractValue + approvedVariations — legacy `D1v2` adjContract / `Obx` cvAdj. */
  adjustedContractValue: number
  /** originalBudget + approvedVariations — legacy `D1` adjBudget (true-overrun base). */
  adjustedBudget: number
  /** Σ codes.committed − adjustedBudget — legacy `D1` trueOverrun (>0 renders pink). */
  trueOverrun: number
  /** Σ codes.actual — legacy `D1` s ("% spent" sub-line). */
  codeActualTotal: number
  /** Σ codes.committed — legacy `D1` c. */
  codeCommittedTotal: number
  /** Σ invoices[Approved].amount — legacy `D1` f. Approved only, never Pending. */
  invoicesOutstanding: number
  /** Σ invoices[Paid].amount — legacy `D1` m / `D1v2` actual / `Obx` invPaid. */
  invoicesPaid: number
  /**
   * Σ invoices[≠Rejected] + Σ purchases[≠cancelled] — legacy `D1v2` committed
   * and `Obx` "Cost to date (invoices + POs)".
   */
  committedToDate: number
  /** max(committedToDate, invoicesPaid) — legacy `D1v2` cost. */
  costToDate: number
  /** adjustedContractValue − costToDate. */
  remainingContract: number
  /** (adjustedContractValue − costToDate) ÷ adjustedContractValue × 100 — legacy `D1v2` margin. */
  currentMarginPct: number
  /**
   * marginTarget − currentMarginPct — legacy `D1v2` erosion. POSITIVE means
   * the margin has eroded below target (note: sign is the legacy convention,
   * opposite of the pre-R0 port field).
   */
  marginErosionPct: number
  /** Project is fixed-price: substantiation / margin treatment differs. */
  isFixedPrice: boolean
}

export function computeProjectFinancials(
  project: Project,
  purchases: Purchase[] = [],
): ProjectFinancials {
  const marginTarget = project.margin ?? 15

  const originalBudget = project.codes.reduce((s, c) => s + (c.budget || 0), 0)
  // Legacy D1: r = u / (1 - t.margin / 100)
  const contractValue = marginTarget < 100 ? originalBudget / (1 - marginTarget / 100) : 0

  const approvedVariations = project.variations
    .filter((v) => v.status === 'Approved')
    .reduce((s, v) => s + (v.amount || 0), 0)
  const pendingVariations = project.variations
    .filter((v) => v.status === 'Pending')
    .reduce((s, v) => s + (v.amount || 0), 0)

  const adjustedContractValue = contractValue + approvedVariations
  const adjustedBudget = originalBudget + approvedVariations

  const codeActualTotal = project.codes.reduce((s, c) => s + (c.actual || 0), 0)
  const codeCommittedTotal = project.codes.reduce((s, c) => s + (c.committed || 0), 0)
  const trueOverrun = codeCommittedTotal - adjustedBudget

  const invoicesOutstanding = project.invoices
    .filter((i) => i.status === 'Approved')
    .reduce((s, i) => s + (i.amount || 0), 0)
  const invoicesPaid = project.invoices
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + (i.amount || 0), 0)

  // Legacy D1v2: committed = invoices ≠ Rejected + purchases ≠ cancelled.
  // (The Vite invoice union has no 'Rejected'; legacy data does — filter by
  // name so both shapes behave identically.)
  const invoicesCommitted = project.invoices
    .filter((i) => (i.status as string) !== 'Rejected')
    .reduce((s, i) => s + (i.amount || 0), 0)
  const purchasesCommitted = purchases
    .filter((p) => p.status !== 'cancelled')
    .reduce((s, p) => s + (p.amount || 0), 0)
  const committedToDate = invoicesCommitted + purchasesCommitted

  // Legacy D1v2: cost = Math.max(committed, actual)
  const costToDate = Math.max(committedToDate, invoicesPaid)
  const remainingContract = adjustedContractValue - costToDate

  const currentMarginPct =
    adjustedContractValue > 0
      ? ((adjustedContractValue - costToDate) / adjustedContractValue) * 100
      : 0
  // Legacy D1v2: erosion = marginTarget - margin
  const marginErosionPct = marginTarget - currentMarginPct

  return {
    originalBudget,
    contractValue,
    approvedVariations,
    pendingVariations,
    adjustedContractValue,
    adjustedBudget,
    trueOverrun,
    codeActualTotal,
    codeCommittedTotal,
    invoicesOutstanding,
    invoicesPaid,
    committedToDate,
    costToDate,
    remainingContract,
    currentMarginPct,
    marginErosionPct,
    isFixedPrice: project.contractType === 'fixed-price',
  }
}

/**
 * Sum of outstanding invoice amounts — legacy `D1` f: **Approved only**.
 * (Pre-R0 the port also counted Pending; legacy never does.)
 */
export function outstandingInvoiceTotal(project: Project): number {
  return project.invoices
    .filter((i) => i.status === 'Approved')
    .reduce((s, i) => s + (i.amount || 0), 0)
}

// ─── Retention & progress-claim maths — legacy `Cl1` ────────────────────────
//
// Legacy stores the retention rate as a PERCENT (5 = 5%) and divides by 100
// at every use: `cl.amount * (ret?.rate ?? 5) / 100`. The pre-R0 port read it
// as a fraction, producing the ×100 retention bug (PARITY gap 18).

/** Retention rate as a percent (legacy unit). Default 5 — legacy `ret?.rate || 5`. */
export function retentionRatePct(state: RootState, projectId: string): number {
  return state.retention[projectId]?.rate ?? 5
}

/** GST on a claim amount — legacy `Cl1`: amount × 0.1 (via central `gstOf`). */
export function claimGst(amount: number): number {
  return gstOf(amount)
}

/** Claim total including GST — legacy `Cl1`: amount × 1.1 (via central `incGst`). */
export function claimTotalIncGst(amount: number): number {
  return incGst(amount)
}

/** Retention withheld on a claim — legacy `Cl1`: amount × rate% ÷ 100. */
export function claimRetention(amount: number, ratePct: number): number {
  return (amount * ratePct) / 100
}

/**
 * Net certified on a claim — legacy `Cl1`: amount × (1 − rate%/100) × 1.1.
 * Retention comes off the ex-GST amount; GST applies to the retained net.
 */
export function claimNetCertified(amount: number, ratePct: number): number {
  return incGst(amount * (1 - ratePct / 100))
}

/**
 * Retention currently held for this project (from state.retention[projectId]).
 */
export function retentionHeld(state: RootState, projectId: string): number {
  const r = state.retention[projectId]
  return r?.held ?? 0
}

// ─── Per-code live committed / actual — legacy `Gc` ─────────────────────────

export interface CodeDocTotals {
  /** Σ invoices[≠Rejected] + Σ purchases[≠cancelled] booked against this code. */
  committed: number
  /** Σ invoices[Paid] booked against this code. */
  actual: number
}

/**
 * Legacy `Gc(code, invoices, purchases)` — the live committed/actual figures
 * the BOQ tab renders per cost code, derived from documents (not the static
 * `code.committed` field).
 */
export function codeDocTotals(
  codeId: string,
  invoices: Project['invoices'],
  purchases: Purchase[],
): CodeDocTotals {
  const committed =
    invoices
      .filter((i) => (i.ccId as string) === codeId && (i.status as string) !== 'Rejected')
      .reduce((s, i) => s + (i.amount || 0), 0) +
    purchases
      .filter((p) => (p.ccId as string) === codeId && p.status !== 'cancelled')
      .reduce((s, p) => s + (p.amount || 0), 0)
  const actual = invoices
    .filter((i) => (i.ccId as string) === codeId && i.status === 'Paid')
    .reduce((s, i) => s + (i.amount || 0), 0)
  return { committed, actual }
}

// ─── PC / PS reconciliation — legacy `Pcps` calc ─────────────────────────────

export interface PcPsCalc {
  allowance: number
  actualCost: number
  /** actualCost − allowance. */
  variance: number
  /** variance × marginRate when over allowance, else 0 — margin on excess ONLY. */
  marginOnExcess: number
  /**
   * variance + marginOnExcess — legacy `Pcps`: net = vr + mx. NOT
   * allowance-based: a row under allowance nets negative (renders as the
   * remaining allowance in legacy's abs-value display).
   */
  netToClaim: number
}

/** Legacy `Pcps` calc(): margin rate defaults to 0.2 when absent/NaN. */
export function reconcilePcPs(
  allowance: number,
  actualCost: number,
  marginRate?: number,
): PcPsCalc {
  const al = allowance || 0
  const ac = actualCost || 0
  const mr = marginRate == null || Number.isNaN(marginRate) ? 0.2 : marginRate
  const variance = ac - al
  const marginOnExcess = variance > 0 ? variance * mr : 0
  return {
    allowance: al,
    actualCost: ac,
    variance,
    marginOnExcess,
    netToClaim: variance + marginOnExcess,
  }
}
