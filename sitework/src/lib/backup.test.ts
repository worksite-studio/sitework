import { describe, it, expect } from 'vitest'
import { backupFileName, parseBackupFile } from './backup'
import type { RootState } from '@/types'

const minimalSeed = (): RootState => ({
  projects: [],
  clients: [],
  subs: [],
  leads: [],
  estimates: [],
  materials: [],
  suppliers: [],
  templates: [],
  milestones: {},
  diary: {},
  timesheets: {},
  defects: {},
  selections: {},
  claims: {},
  purchases: {},
  primeCostItems: {},
  provisionalSums: {},
  rfis: {},
  retention: {},
  settings: {},
})

describe('backupFileName', () => {
  it('is a dated json filename', () => {
    expect(backupFileName(new Date('2026-07-03T12:00:00'))).toBe('sitework-backup-2026-07-03.json')
  })
})

describe('parseBackupFile', () => {
  it('round-trips an exported state', () => {
    const seed = minimalSeed()
    const state: RootState = {
      ...seed,
      projects: [{ id: 'PRJ-001', name: 'Test build' } as unknown as RootState['projects'][number]],
      settings: { businessName: 'Worksite' },
    }
    const restored = parseBackupFile(JSON.stringify(state, null, 2), seed)
    expect(restored).toEqual(state)
  })

  it('rejects malformed JSON', () => {
    expect(parseBackupFile('{not json', minimalSeed())).toBeNull()
  })

  it('rejects JSON that is not an object', () => {
    expect(parseBackupFile('[1,2,3]', minimalSeed())).toBeNull()
    expect(parseBackupFile('"hello"', minimalSeed())).toBeNull()
  })

  it('rejects objects that are not a SITEWORK backup', () => {
    expect(parseBackupFile('{"foo": 1}', minimalSeed())).toBeNull()
  })

  it('fills newly added top-level keys from seed (older backups stay restorable)', () => {
    const seed = minimalSeed()
    const old = { projects: [], settings: { businessName: 'Old' } }
    const restored = parseBackupFile(JSON.stringify(old), seed)
    expect(restored).not.toBeNull()
    expect(restored!.leads).toEqual([])
    expect(restored!.settings.businessName).toBe('Old')
  })
})
