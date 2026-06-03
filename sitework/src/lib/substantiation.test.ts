import { describe, it, expect } from 'vitest'
import { checkSubstantiation } from './substantiation'
import { seed } from '@/state/seed'
import { asId } from '@/types'
import type { ProjectId } from '@/types'

const COSTPLUS = seed.projects.find((p) => p.id === asId<ProjectId>('PRJ-001'))!
const FIXED = seed.projects.find((p) => p.contractType === 'fixed-price')!

describe('checkSubstantiation', () => {
  it('blocks cost-plus without any docs', () => {
    expect(checkSubstantiation(COSTPLUS, undefined).blocked).toBe(true)
    expect(checkSubstantiation(COSTPLUS, []).blocked).toBe(true)
  })

  it('allows cost-plus with at least one doc', () => {
    const docs = [{ name: 'receipt.pdf', dataUrl: '', size: 100 }]
    expect(checkSubstantiation(COSTPLUS, docs).blocked).toBe(false)
  })

  it('never blocks fixed-price (docs optional)', () => {
    expect(checkSubstantiation(FIXED, undefined).blocked).toBe(false)
    expect(checkSubstantiation(FIXED, []).blocked).toBe(false)
    expect(checkSubstantiation(FIXED, [{ name: 'x', dataUrl: '', size: 0 }]).blocked).toBe(false)
  })

  it('returns a helpful reason when blocked', () => {
    const r = checkSubstantiation(COSTPLUS, [])
    expect(r.blocked).toBe(true)
    expect(r.reason).toMatch(/supporting document/i)
  })
})
