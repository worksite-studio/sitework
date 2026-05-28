import { describe, it, expect } from 'vitest'
import { seed } from './seed'
import { reducer } from './reducer'
import { asId } from '@/types'
import type { ProjectId } from '@/types'

/**
 * Guards the auto-generated seed against extraction regressions. If
 * extract-seed.mjs ever produces a malformed shape, these fail loudly.
 */
describe('seed integrity', () => {
  it('has the expected top-level collections', () => {
    expect(Array.isArray(seed.projects)).toBe(true)
    expect(Array.isArray(seed.clients)).toBe(true)
    expect(Array.isArray(seed.subs)).toBe(true)
    expect(Array.isArray(seed.templates)).toBe(true)
    expect(typeof seed.claims).toBe('object')
    expect(typeof seed.retention).toBe('object')
  })

  it('includes the fixed-price PRJ-005 (Phase 2 seed addition)', () => {
    const p = seed.projects.find((proj) => proj.id === ('PRJ-005' as ProjectId))
    expect(p).toBeDefined()
    expect(p!.contractType).toBe('fixed-price')
  })

  it('every project has a non-empty codes array', () => {
    for (const p of seed.projects) {
      expect(p.codes.length).toBeGreaterThan(0)
    }
  })

  it('PRJ-005 has PC and PS items (regression guard for the misplacement bug)', () => {
    expect(seed.primeCostItems['PRJ-005']).toBeDefined()
    expect(seed.provisionalSums['PRJ-005']).toBeDefined()
  })

  it('a representative reducer action runs cleanly against the real seed', () => {
    const before = seed.projects.length
    const next = reducer(seed, {
      type: 'UPDATE_PROJECT',
      projectId: asId<ProjectId>('PRJ-001'),
      patch: { name: 'Renamed In Test' },
    })
    expect(next.projects).toHaveLength(before)
    expect(next.projects.find((p) => p.id === ('PRJ-001' as ProjectId))!.name).toBe(
      'Renamed In Test',
    )
    // Seed itself untouched (immutability)
    expect(seed.projects.find((p) => p.id === ('PRJ-001' as ProjectId))!.name).not.toBe(
      'Renamed In Test',
    )
  })
})
