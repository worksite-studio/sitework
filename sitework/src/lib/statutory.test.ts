import { describe, it, expect } from 'vitest'
import { depositCapText, qldHwsAckRequired, vicS13Blocked, VIC_S13_THRESHOLD } from './statutory'

describe('vicS13Blocked', () => {
  const base = {
    state: 'VIC',
    contractType: 'cost-plus',
    estimatedValue: 500_000,
    isRenovationWithUnknownCost: false,
  } as const

  it('blocks VIC cost-plus under $1m with no renovation exemption', () => {
    expect(vicS13Blocked(base)).toBe(true)
  })

  it('allows at exactly $1m (threshold is "≥ $1m permitted")', () => {
    expect(vicS13Blocked({ ...base, estimatedValue: VIC_S13_THRESHOLD })).toBe(false)
  })

  it('blocks just below the threshold', () => {
    expect(vicS13Blocked({ ...base, estimatedValue: VIC_S13_THRESHOLD - 1 })).toBe(true)
  })

  it('allows when the renovation/unknown-cost exemption is ticked', () => {
    expect(vicS13Blocked({ ...base, isRenovationWithUnknownCost: true })).toBe(false)
  })

  it('never blocks fixed-price', () => {
    expect(vicS13Blocked({ ...base, contractType: 'fixed-price' })).toBe(false)
  })

  it('never blocks outside VIC', () => {
    expect(vicS13Blocked({ ...base, state: 'NSW' })).toBe(false)
    expect(vicS13Blocked({ ...base, state: 'QLD' })).toBe(false)
  })

  it('treats a blank/zero estimate as under the threshold (blocked)', () => {
    expect(vicS13Blocked({ ...base, estimatedValue: 0 })).toBe(true)
  })
})

describe('qldHwsAckRequired', () => {
  it('requires the acknowledgement for QLD cost-plus', () => {
    expect(
      qldHwsAckRequired({ state: 'QLD', contractType: 'cost-plus', qldHwsAcknowledged: false }),
    ).toBe(true)
  })

  it('passes once acknowledged', () => {
    expect(
      qldHwsAckRequired({ state: 'QLD', contractType: 'cost-plus', qldHwsAcknowledged: true }),
    ).toBe(false)
  })

  it('never applies to fixed-price or other states', () => {
    expect(
      qldHwsAckRequired({ state: 'QLD', contractType: 'fixed-price', qldHwsAcknowledged: false }),
    ).toBe(false)
    expect(
      qldHwsAckRequired({ state: 'NSW', contractType: 'cost-plus', qldHwsAcknowledged: false }),
    ).toBe(false)
  })
})

describe('depositCapText', () => {
  // Copy is pinned verbatim to the baseline (legacy/index.html `depositCapText`).
  it.each([
    ['NSW', 'NSW: max 10% of contract or $20,000, whichever is less (HBA 1989)'],
    ['VIC', 'VIC: max 10% if contract under $20k, 5% if $20k or more (DBCA 1995)'],
    ['WA', 'WA: max 6.5% of total contract value as deposit (before work begins, HBCA s.13)'],
    ['QLD', 'QLD: max 5% if contract $20k+, 10% if under (QBCC Act Sch 1B)'],
    ['SA', 'SA: standard 5% deposit convention (Building Work Contractors Act 1995)'],
    [
      'TAS',
      'TAS: confirm deposit cap with Consumer Building and Occupational Services (Residential Building Work Contracts Act 2016)',
    ],
    ['ACT', 'ACT: confirm deposit cap with Construction Occupations Registrar (Building Act 2004)'],
    [
      'NT',
      'NT: confirm deposit cap with NT Consumer Affairs (Building Act 1993); non-uniform SOP regime applies',
    ],
  ])('%s matches the baseline text', (state, text) => {
    expect(depositCapText(state)).toBe(text)
  })

  it('falls back for unknown states', () => {
    expect(depositCapText('NZ')).toBe('Confirm against current state regulation')
  })
})
