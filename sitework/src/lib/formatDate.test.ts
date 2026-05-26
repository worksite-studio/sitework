import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('formats an ISO date string', () => {
    expect(formatDate('2026-05-26')).toBe('26 May 2026')
  })

  it('formats a Date object', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('1 Jan 2026')
  })

  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('returns the original string for unparseable input', () => {
    expect(formatDate('not a date')).toBe('not a date')
  })

  it('handles single-digit days', () => {
    expect(formatDate('2026-12-09')).toBe('9 Dec 2026')
  })
})
