import { describe, it, expect } from 'vitest'
import { computeDashboardKpis, computePipelineCounts } from './computeKpis'
import { formatCurrency } from '@/lib/formatCurrency'
import { seed } from '@/state/seed'

describe('computeDashboardKpis (against seed)', () => {
  it('counts active projects (status === "live")', () => {
    const kpis = computeDashboardKpis(seed)
    const expected = seed.projects.filter((p) => p.status === 'live').length
    expect(kpis.activeProjectsCount).toBe(expected)
  })

  // Legacy Y1 semantics (R0, PARITY gap 17): live projects only, Approved
  // invoices only. Pinned literals are what :8766 renders (2026-07-08 dump).
  it('outstanding invoices = Approved only, live projects → $120,542 (:8766 KPI)', () => {
    const kpis = computeDashboardKpis(seed)
    let expected = 0
    let count = 0
    for (const p of seed.projects.filter((p) => p.status === 'live')) {
      for (const inv of p.invoices) {
        if (inv.status === 'Approved') {
          expected += inv.amount
          count += 1
        }
      }
    }
    expect(kpis.outstandingInvoicesTotal).toBeCloseTo(expected, 2)
    expect(kpis.outstandingInvoicesCount).toBe(count)
    expect(formatCurrency(kpis.outstandingInvoicesTotal)).toBe('$120,542')
  })

  it('open variations = Pending on live projects → $3,200 (:8766 KPI)', () => {
    const kpis = computeDashboardKpis(seed)
    const pendingCount = seed.projects
      .filter((p) => p.status === 'live')
      .reduce((n, p) => n + p.variations.filter((v) => v.status === 'Pending').length, 0)
    expect(kpis.openVariationsCount).toBe(pendingCount)
    expect(formatCurrency(kpis.openVariationsTotal)).toBe('$3,200')
  })

  it('portfolio contract value = Σ budget ÷ (1 − margin/100) → "$0.7M" sublabel (:8766)', () => {
    const kpis = computeDashboardKpis(seed)
    expect(`$${(kpis.portfolioContractValue / 1e6).toFixed(1)}M`).toBe('$0.7M')
  })

  it('portfolio margin = (contract − budgets) ÷ contract → 17% (:8766 KPI)', () => {
    const kpis = computeDashboardKpis(seed)
    expect(kpis.portfolioMarginPct).toBe(17)
  })

  it('flags an expired cert when the seed sub has expiry in the past', () => {
    // Use a fixed "today" beyond any reasonable cert expiry — every dated
    // field becomes "expired" so the count must be > 0.
    const kpis = computeDashboardKpis(seed, new Date('2099-01-01'))
    expect(kpis.expiredCertsCount).toBeGreaterThan(0)
  })

  it('returns 0 for everything on an empty state', () => {
    const empty = {
      ...seed,
      projects: [],
      subs: [],
      leads: [],
    }
    const kpis = computeDashboardKpis(empty)
    expect(kpis.activeProjectsCount).toBe(0)
    expect(kpis.outstandingInvoicesTotal).toBe(0)
    expect(kpis.openVariationsTotal).toBe(0)
    expect(kpis.portfolioMarginPct).toBe(0)
  })
})

describe('computePipelineCounts', () => {
  it('buckets leads by stage', () => {
    const counts = computePipelineCounts(seed)
    const sum = counts.prospect + counts.tendering + counts.won + counts.lost
    expect(sum).toBeLessThanOrEqual(seed.leads.length)
  })
})
