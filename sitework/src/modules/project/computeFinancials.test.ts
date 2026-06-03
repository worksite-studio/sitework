import { describe, it, expect } from 'vitest'
import { computeProjectFinancials, outstandingInvoiceTotal } from './computeFinancials'
import { seed } from '@/state/seed'
import { asId } from '@/types'
import type { ProjectId } from '@/types'

const PRJ001 = seed.projects.find((p) => p.id === asId<ProjectId>('PRJ-001'))!

describe('computeProjectFinancials (against seed PRJ-001)', () => {
  it('original budget equals sum of code budgets', () => {
    const fin = computeProjectFinancials(PRJ001)
    const expected = PRJ001.codes.reduce((s, c) => s + c.budget, 0)
    expect(fin.originalBudget).toBe(expected)
  })

  it('adjusted CV = original + approved variations', () => {
    const fin = computeProjectFinancials(PRJ001)
    const approved = PRJ001.variations
      .filter((v) => v.status === 'Approved')
      .reduce((s, v) => s + v.amount, 0)
    expect(fin.adjustedContractValue).toBeCloseTo(fin.originalBudget + approved, 2)
  })

  it('cost to date = sum of code actuals', () => {
    const fin = computeProjectFinancials(PRJ001)
    expect(fin.costToDate).toBe(PRJ001.codes.reduce((s, c) => s + c.actual, 0))
  })

  it('margin erosion is current minus target', () => {
    const fin = computeProjectFinancials(PRJ001)
    expect(fin.marginErosionPct).toBeCloseTo(fin.currentMarginPct - PRJ001.margin, 5)
  })

  it('isFixedPrice reflects contractType', () => {
    expect(computeProjectFinancials(PRJ001).isFixedPrice).toBe(
      PRJ001.contractType === 'fixed-price',
    )
  })
})

describe('outstandingInvoiceTotal', () => {
  it('sums Approved + Pending invoices, excludes Paid + Disputed', () => {
    const total = outstandingInvoiceTotal(PRJ001)
    const expected = PRJ001.invoices
      .filter((i) => i.status === 'Approved' || i.status === 'Pending')
      .reduce((s, i) => s + i.amount, 0)
    expect(total).toBeCloseTo(expected, 2)
  })
})

describe('computeProjectFinancials (empty project)', () => {
  it('returns zeros and 0% margin when there are no codes', () => {
    const empty = { ...PRJ001, codes: [], variations: [], invoices: [], margin: 0 }
    const fin = computeProjectFinancials(empty)
    expect(fin.originalBudget).toBe(0)
    expect(fin.adjustedContractValue).toBe(0)
    expect(fin.currentMarginPct).toBe(0)
  })
})
