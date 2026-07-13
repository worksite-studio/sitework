import { describe, it, expect } from 'vitest'
import { GST_RATE, roundCents, gstOf, incGst, parseAmount } from './money'

describe('roundCents', () => {
  it('kills binary-float drift', () => {
    expect(roundCents(0.1 + 0.2)).toBe(0.3)
    expect(roundCents(110.00000000000001)).toBe(110)
  })

  it('rounds half up at the cent', () => {
    expect(roundCents(1.005)).toBe(1.01)
    expect(roundCents(1.004)).toBe(1)
  })

  it('leaves whole dollars untouched', () => {
    expect(roundCents(45000)).toBe(45000)
  })
})

describe('gstOf / incGst', () => {
  it('GST is 10% of the ex-GST amount', () => {
    expect(GST_RATE).toBe(0.1)
    expect(gstOf(1000)).toBe(100)
    expect(gstOf(45000)).toBe(4500)
  })

  it('inc-GST total is 110% of the ex-GST amount', () => {
    expect(incGst(1000)).toBe(1100)
    expect(incGst(45000)).toBe(49500)
  })

  it('cents-rounds derived values (no float artefacts)', () => {
    // 333.33 × 0.1 = 33.333 → 33.33; × 1.1 = 366.663 → 366.66
    expect(gstOf(333.33)).toBe(33.33)
    expect(incGst(333.33)).toBe(366.66)
  })

  it('preserves the pinned legacy claim numbers', () => {
    // Claim #1: amount $45,000 → GST $4,500, total inc GST $49,500.
    expect(gstOf(45000)).toBe(4500)
    expect(incGst(45000)).toBe(49500)
  })
})

describe('parseAmount', () => {
  it('parses plain numeric strings', () => {
    expect(parseAmount('1000')).toBe(1000)
    expect(parseAmount('45.5')).toBe(45.5)
  })

  it('tolerates currency formatting the old idiom dropped', () => {
    expect(parseAmount('$1,000')).toBe(1000)
    expect(parseAmount(' 2 500 ')).toBe(2500)
    expect(parseAmount('$45,000.50')).toBe(45000.5)
  })

  it('returns the fallback for empty or junk input', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('', 1)).toBe(1)
    expect(parseAmount('nope', 0.2)).toBe(0.2)
  })

  it('passes finite numbers through and guards non-finite', () => {
    expect(parseAmount(1234)).toBe(1234)
    expect(parseAmount(NaN)).toBe(0)
    expect(parseAmount(Infinity, 5)).toBe(5)
  })

  it('handles null and undefined', () => {
    expect(parseAmount(null)).toBe(0)
    expect(parseAmount(undefined, 1)).toBe(1)
  })
})
