import type { RootState } from '@/types'

/**
 * Pure portfolio-KPI calculations consumed by DashboardPage. Kept here
 * (not inline in the component) so unit tests can assert numbers against
 * known fixtures and the math is auditable.
 */

export interface DashboardKpis {
  activeProjectsCount: number
  outstandingInvoicesTotal: number
  outstandingInvoicesCount: number
  openVariationsTotal: number
  openVariationsCount: number
  portfolioMarginPct: number
  expiringCertsCount: number
  expiredCertsCount: number
}

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000

export function computeDashboardKpis(state: RootState, today: Date = new Date()): DashboardKpis {
  const active = state.projects.filter((p) => p.status === 'live')

  // Outstanding invoices = approved-but-not-paid, across all projects.
  let outstandingInvoicesTotal = 0
  let outstandingInvoicesCount = 0
  // Open variations = Pending, across all projects.
  let openVariationsTotal = 0
  let openVariationsCount = 0

  for (const p of state.projects) {
    for (const inv of p.invoices) {
      if (inv.status === 'Approved' || inv.status === 'Pending') {
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

  // Portfolio margin: weighted average of project.margin by active-project
  // contract value (budget total). Falls back to a simple average if no
  // budget is set anywhere.
  let weightedSum = 0
  let weightTotal = 0
  for (const p of active) {
    const budget = p.codes.reduce((s, c) => s + (c.budget || 0), 0)
    if (budget > 0) {
      weightedSum += p.margin * budget
      weightTotal += budget
    }
  }
  const portfolioMarginPct =
    weightTotal > 0
      ? weightedSum / weightTotal
      : active.length > 0
        ? active.reduce((s, p) => s + p.margin, 0) / active.length
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
