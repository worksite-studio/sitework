import type { RootState } from '@/types'

/**
 * Pure portfolio-KPI calculations consumed by DashboardPage. Kept here
 * (not inline in the component) so unit tests can assert numbers against
 * known fixtures and the math is auditable.
 */

export interface DashboardKpis {
  activeProjectsCount: number
  /** Σ over LIVE projects of budget ÷ (1 − margin/100) — legacy `Y1` n. */
  portfolioContractValue: number
  outstandingInvoicesTotal: number
  outstandingInvoicesCount: number
  openVariationsTotal: number
  openVariationsCount: number
  portfolioMarginPct: number
  expiringCertsCount: number
  expiredCertsCount: number
}

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Transliterated from legacy `Y1` (R0, PARITY gap 17): every money KPI scopes
 * to LIVE projects only; outstanding invoices are Approved only (never
 * Pending); portfolio contract value carries the margin markup; portfolio
 * margin is derived from contract values, not averaged from targets.
 */
export function computeDashboardKpis(state: RootState, today: Date = new Date()): DashboardKpis {
  const active = state.projects.filter((p) => p.status === 'live')

  // Legacy Y1: n = Σ active budget / (1 - margin/100)
  let budgetTotal = 0
  let portfolioContractValue = 0
  for (const p of active) {
    const budget = p.codes.reduce((s, c) => s + (c.budget || 0), 0)
    budgetTotal += budget
    const margin = p.margin ?? 15
    portfolioContractValue += margin < 100 ? budget / (1 - margin / 100) : 0
  }

  // Legacy Y1: u = active projects' Approved invoices; c = active Pending variations.
  let outstandingInvoicesTotal = 0
  let outstandingInvoicesCount = 0
  let openVariationsTotal = 0
  let openVariationsCount = 0
  for (const p of active) {
    for (const inv of p.invoices) {
      if (inv.status === 'Approved') {
        outstandingInvoicesTotal += inv.amount
        outstandingInvoicesCount += 1
      }
    }
    for (const v of p.variations) {
      if (v.status === 'Pending') {
        openVariationsTotal += v.amount
        openVariationsCount += 1
      }
    }
  }

  // Legacy Y1: g = round((n − Σ budgets) / n × 100)
  const portfolioMarginPct =
    portfolioContractValue > 0
      ? Math.round(((portfolioContractValue - budgetTotal) / portfolioContractValue) * 100)
      : 0

  // Expiring / expired cert counts — uses Phase 1.5-E subcontractor certs +
  // the always-present liabilityExp / wcExp date strings.
  const now = today.getTime()
  let expiringCertsCount = 0
  let expiredCertsCount = 0
  const checkDate = (iso: string | undefined | null) => {
    if (!iso) return
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return
    if (t < now) expiredCertsCount += 1
    else if (t - now <= DAYS_30_MS) expiringCertsCount += 1
  }
  for (const sub of state.subs) {
    checkDate(sub.liabilityExp)
    checkDate(sub.wcExp)
    for (const cert of sub.certificates ?? []) {
      checkDate(cert.expiry)
    }
  }

  return {
    activeProjectsCount: active.length,
    portfolioContractValue,
    outstandingInvoicesTotal,
    outstandingInvoicesCount,
    openVariationsTotal,
    openVariationsCount,
    portfolioMarginPct,
    expiringCertsCount,
    expiredCertsCount,
  }
}

/** Lead pipeline counts by stage — used for the Pipeline panel. */
export function computePipelineCounts(state: RootState) {
  const buckets = { prospect: 0, tendering: 0, won: 0, lost: 0 }
  for (const lead of state.leads) {
    if (lead.stage in buckets) buckets[lead.stage as keyof typeof buckets] += 1
  }
  return buckets
}
