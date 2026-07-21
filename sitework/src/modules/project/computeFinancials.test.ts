import { describe, it, expect } from 'vitest'
import {
  claimGst,
  claimNetCertified,
  claimRef,
  claimRetention,
  claimTotalIncGst,
  computeProjectFinancials,
  outstandingInvoiceTotal,
  reconcilePcPs,
  retentionRatePct,
} from './computeFinancials'
import { formatCurrency } from '@/lib/formatCurrency'
import { seed } from '@/state/seed'
import { asId } from '@/types'
import type { ProjectId } from '@/types'

/**
 * R0 acceptance (PARITY gaps 17/18): the pinned literals below are the
 * numbers the legacy baseline actually renders on :8766 for Akademie
 * (PRJ-001), captured by text dump on 2026-07-08 — Overview stat row,
 * Open Book "Contract & Cost Summary", PC & PS tables, dashboard KPIs.
 * If one of these fails, the port's maths has drifted from the spec.
 */

const PRJ001 = seed.projects.find((p) => p.id === asId<ProjectId>('PRJ-001'))!
const PRJ001_POS = seed.purchases['PRJ-001'] ?? []
const fin = () => computeProjectFinancials(PRJ001, PRJ001_POS)

describe('legacy money semantics — exact :8766 renders (PRJ-001)', () => {
  it('original budget renders $232,531', () => {
    expect(formatCurrency(fin().originalBudget)).toBe('$232,531')
  })

  it('contract value = budget ÷ (1 − margin/100) → $273,566 (legacy D1 r / Obx cv)', () => {
    expect(formatCurrency(fin().contractValue)).toBe('$273,566')
  })

  it('approved variations render $78,712, pending $1,200', () => {
    expect(formatCurrency(fin().approvedVariations)).toBe('$78,712')
    expect(formatCurrency(fin().pendingVariations)).toBe('$1,200')
  })

  it('adjusted contract value = contract + approved vars → $352,279 (legacy Obx cvAdj)', () => {
    expect(formatCurrency(fin().adjustedContractValue)).toBe('$352,279')
  })

  it('true overrun = Σ code committed − (budget + approved vars) → $33,119 (legacy D1)', () => {
    expect(formatCurrency(fin().trueOverrun)).toBe('$33,119')
  })

  it('committed to date = invoices ≠Rejected + POs ≠cancelled → $268,357 (legacy Obx costToDate)', () => {
    expect(formatCurrency(fin().committedToDate)).toBe('$268,357')
  })

  it('outstanding invoices = Approved ONLY → $120,542; paid $52,988 (legacy D1 f/m)', () => {
    expect(formatCurrency(fin().invoicesOutstanding)).toBe('$120,542')
    expect(formatCurrency(fin().invoicesPaid)).toBe('$52,988')
    expect(formatCurrency(outstandingInvoiceTotal(PRJ001))).toBe('$120,542')
  })

  it('"% spent" sub-line = code actuals ÷ budget → 138% (legacy D1)', () => {
    const f = fin()
    expect(((f.codeActualTotal / f.originalBudget) * 100).toFixed(0)).toBe('138')
  })

  it('cost to date = max(committed, paid invoices) (legacy D1v2 cost)', () => {
    const f = fin()
    expect(f.costToDate).toBe(Math.max(f.committedToDate, f.invoicesPaid))
  })

  it('margin erosion sign: positive means eroded below target (legacy D1v2)', () => {
    const f = fin()
    expect(f.marginErosionPct).toBeCloseTo((PRJ001.margin ?? 15) - f.currentMarginPct, 6)
  })
})

describe('claim retention maths — legacy Cl1 (gap 18: rate is a PERCENT)', () => {
  it('seed rate for PRJ-001 is 5 (percent) and retentionRatePct returns it', () => {
    expect(seed.retention['PRJ-001']?.rate).toBe(5)
    expect(retentionRatePct(seed, 'PRJ-001')).toBe(5)
  })

  it('defaults to 5% when no retention record exists', () => {
    expect(retentionRatePct(seed, 'NO-SUCH-PROJECT')).toBe(5)
  })

  it('claim #1 ($45,000): retention $2,250, net certified $47,025 — the :8766 row', () => {
    const claim1 = (seed.claims['PRJ-001'] ?? [])[0]!
    const pct = retentionRatePct(seed, 'PRJ-001')
    expect(formatCurrency(claimRetention(claim1.amount, pct))).toBe('$2,250')
    expect(formatCurrency(claimNetCertified(claim1.amount, pct))).toBe('$47,025')
    expect(formatCurrency(claimGst(claim1.amount))).toBe('$4,500')
    expect(formatCurrency(claimTotalIncGst(claim1.amount))).toBe('$49,500')
  })

  it('net certified = amount × (1 − rate/100) × 1.1 — GST applies to the retained net', () => {
    expect(claimNetCertified(1000, 5)).toBeCloseTo(1045, 6)
    expect(claimNetCertified(1000, 0)).toBeCloseTo(1100, 6)
  })

  it('claimRef composes a project-scoped reference (4.7-I)', () => {
    expect(claimRef('PRJ-001', 1)).toBe('PRJ-001-C1')
    expect(claimRef('PRJ-042', 12)).toBe('PRJ-042-C12')
  })
})

describe('PC/PS reconciliation — legacy Pcps calc', () => {
  it('Tapware ($3,000 allowance, $4,500 actual, 20% margin): +$1,500 / $300 / +$1,800', () => {
    const r = reconcilePcPs(3000, 4500, 0.2)
    expect(r.variance).toBe(1500)
    expect(r.marginOnExcess).toBe(300)
    expect(r.netToClaim).toBe(1800)
  })

  it('under allowance: net = variance (negative), no margin — Oven $4,500 unspent', () => {
    const r = reconcilePcPs(4500, 0, 0.2)
    expect(r.variance).toBe(-4500)
    expect(r.marginOnExcess).toBe(0)
    expect(r.netToClaim).toBe(-4500)
  })

  it('margin rate defaults to 0.2 when absent', () => {
    expect(reconcilePcPs(1000, 2000).marginOnExcess).toBe(200)
    expect(reconcilePcPs(1000, 2000, Number.NaN).marginOnExcess).toBe(200)
  })

  it('PRJ-001 PC net total renders $5,200; PS net total $5,000 (:8766 footers, abs display)', () => {
    const pcNet = (seed.primeCostItems['PRJ-001'] ?? []).reduce(
      (s, x) => s + reconcilePcPs(x.allowance, x.actualCost, x.marginRate).netToClaim,
      0,
    )
    const psNet = (seed.provisionalSums['PRJ-001'] ?? []).reduce(
      (s, x) => s + reconcilePcPs(x.allowance, x.actualCost, x.marginRate).netToClaim,
      0,
    )
    expect(formatCurrency(Math.abs(pcNet))).toBe('$5,200')
    expect(formatCurrency(Math.abs(psNet))).toBe('$5,000')
  })
})

describe('computeProjectFinancials (empty project)', () => {
  it('returns zeros and 0% margin when there are no codes', () => {
    const empty = { ...PRJ001, codes: [], variations: [], invoices: [], margin: 0 }
    const f = computeProjectFinancials(empty)
    expect(f.originalBudget).toBe(0)
    expect(f.contractValue).toBe(0)
    expect(f.adjustedContractValue).toBe(0)
    expect(f.currentMarginPct).toBe(0)
  })
})
