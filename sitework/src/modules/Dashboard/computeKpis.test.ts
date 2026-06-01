import { describe, it, expect } from 'vitest'
import { computeDashboardKpis, computePipelineCounts } from './computeKpis'
import { seed } from '@/state/seed'

describe('computeDashboardKpis (against seed)', () => {
  it('counts active projects (status === "live")', () => {
    const kpis = computeDashboardKpis(seed)
    const expected = seed.projects.filter((p) => p.status === 'live').length
    expect(kpis.activeProjectsCount).toBe(expected)
  })

  it('outstanding invoice total matches sum of Approved + Pending invoice amounts', () => {
    const kpis = computeDashboardKpis(seed)
    let expected = 0
    let count = 0
    for (const p of seed.projects) {
      for (const inv of p.invoices) {
        if (inv.status === 'Approved' || inv.status === 'Pending') {
          expected += inv.amount
          count += 1
        }
      }
    }
    expect(kpis.outstandingInvoicesTotal).toBeCloseTo(expected, 2)
    expect(kpis.outstandingInvoicesCount).toBe(count)
  })

  it('open variations counts Pending only', () => {
    const kpis = computeDashboardKpis(seed)
    const pendingCount = seed.projects.reduce(
      (n, p) => n + p.variations.filter((v) => v.status === 'Pending').length,
      0,
    )
    expect(kpis.openVariationsCount).toBe(pendingCount)
  })

  it('portfolio margin is a sensible 0–100 number for the seed', () => {
    const kpis = computeDashboardKpis(seed)
    expect(kpis.portfolioMarginPct).toBeGreaterThan(0)
    expect(kpis.portfolioMarginPct).toBeLessThan(100)
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
