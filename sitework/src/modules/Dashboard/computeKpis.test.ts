import { describe, it, expect } from 'vitest'
import { computeDashboardKpis, computePipelineCounts, computeProjectRegister } from './computeKpis'
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

describe('computeProjectRegister (4.7-H)', () => {
  it('includes only live projects', () => {
    const rows = computeProjectRegister(seed)
    const liveCount = seed.projects.filter((p) => p.status === 'live').length
    expect(rows).toHaveLength(liveCount)
    expect(rows.every((r) => r.status === 'live')).toBe(true)
  })

  it('derives budget/committed/spend and the health band per row', () => {
    const rows = computeProjectRegister(seed)
    for (const r of rows) {
      const p = seed.projects.find((pp) => pp.id === r.id)!
      const budget = p.codes.reduce((s, c) => s + (c.budget || 0), 0)
      const committed = p.codes.reduce((s, c) => s + (c.committed || 0), 0)
      expect(r.budget).toBe(budget)
      expect(r.committed).toBe(committed)
      expect(r.spentPct).toBe(budget > 0 ? Math.round((committed / budget) * 100) : 0)
      const expected =
        budget === 0
          ? 'none'
          : committed <= budget
            ? 'on'
            : committed <= budget * 1.1
              ? 'risk'
              : 'over'
      expect(r.health).toBe(expected)
    }
  })

  it('sorts by attention score (most-pressing first), then spend, then name', () => {
    const rows = computeProjectRegister(seed)
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1]!
      const b = rows[i]!
      const ordered =
        a.score > b.score ||
        (a.score === b.score && a.spentPct > b.spentPct) ||
        (a.score === b.score && a.spentPct === b.spentPct && a.name.localeCompare(b.name) <= 0)
      expect(ordered).toBe(true)
    }
  })

  it('flags a claim as due when an unpaid claim is overdue relative to today', () => {
    const live = seed.projects.find((p) => p.status === 'live')!
    const claims = seed.claims[live.id as string] ?? []
    const anyUnpaid = claims.some((c) => c.status !== 'Paid' && !!c.due)
    // With a far-future "today", every unpaid dated claim is overdue → due.
    const rows = computeProjectRegister(seed, new Date('2099-01-01'))
    const row = rows.find((r) => r.id === live.id)!
    expect(row.flags.claimDue).toBe(anyUnpaid)
  })

  it('marks overBudget only when committed exceeds budget', () => {
    const rows = computeProjectRegister(seed)
    for (const r of rows) {
      expect(r.flags.overBudget).toBe(r.health === 'over')
    }
  })

  it('returns an empty register when there are no projects', () => {
    expect(computeProjectRegister({ ...seed, projects: [] })).toEqual([])
  })
})

describe('computePipelineCounts', () => {
  it('buckets leads by stage', () => {
    const counts = computePipelineCounts(seed)
    const sum = counts.prospect + counts.tendering + counts.won + counts.lost
    expect(sum).toBeLessThanOrEqual(seed.leads.length)
  })
})
