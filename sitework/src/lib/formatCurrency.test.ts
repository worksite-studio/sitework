import { describe, it, expect } from 'vitest'
import { formatCurrency } from './formatCurrency'

describe('formatCurrency', () => {
  it('formats whole dollars without cents', () => {
    expect(formatCurrency(12345)).toBe('$12,345')
  })

  it('formats sub-thousand amounts', () => {
    expect(formatCurrency(99)).toBe('$99')
  })

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('handles negatives', () => {
    expect(formatCurrency(-2500)).toBe('-$2,500')
  })

  it('rounds non-integers to the nearest dollar', () => {
    expect(formatCurrency(99.49)).toBe('$99')
    expect(formatCurrency(99.5)).toBe('$100')
  })
})
