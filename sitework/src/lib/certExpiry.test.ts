import { describe, it, expect } from 'vitest'
import { expiryLabel, getExpiryInfo } from './certExpiry'

const NOW = new Date('2026-06-01T00:00:00Z')

describe('getExpiryInfo', () => {
  it('returns unknown for empty / invalid input', () => {
    expect(getExpiryInfo(null, NOW).status).toBe('unknown')
    expect(getExpiryInfo('', NOW).status).toBe('unknown')
    expect(getExpiryInfo('not-a-date', NOW).status).toBe('unknown')
  })

  it('flags dates in the past as expired', () => {
    const info = getExpiryInfo('2026-04-01', NOW)
    expect(info.status).toBe('expired')
    expect(info.daysUntil).toBeLessThan(0)
  })

  it('flags dates within 30 days as expiring', () => {
    expect(getExpiryInfo('2026-06-15', NOW).status).toBe('expiring')
    expect(getExpiryInfo('2026-06-30', NOW).status).toBe('expiring')
  })

  it('flags dates more than 30 days out as current', () => {
    expect(getExpiryInfo('2026-08-01', NOW).status).toBe('current')
  })

  it('treats today as expiring', () => {
    expect(getExpiryInfo('2026-06-01', NOW).status).toBe('expiring')
  })
})

describe('expiryLabel', () => {
  it('formats each status with helpful copy', () => {
    expect(expiryLabel(getExpiryInfo('2026-04-01', NOW))).toMatch(/^Expired/)
    expect(expiryLabel(getExpiryInfo('2026-06-15', NOW))).toMatch(/^Expires in/)
    expect(expiryLabel(getExpiryInfo('2026-06-01', NOW))).toBe('Expires today')
    expect(expiryLabel(getExpiryInfo('2026-08-01', NOW))).toMatch(/^Current/)
    expect(expiryLabel(getExpiryInfo(null, NOW))).toBe('No date')
  })
})
