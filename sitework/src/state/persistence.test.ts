import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  loadInitialState,
  mergeSeedWithStored,
  normalizeScheduleTree,
  useReducerPersisted,
  STATE_KEY,
  LEGACY_KEY,
  type PersistedStorage,
} from './persistence'
import { migrateLegacyState } from './migrate-v1'
import { asId } from '@/types'
import type { RootState, ScheduleTask, ScheduleTaskId } from '@/types'

class MemoryStorage implements PersistedStorage {
  private map = new Map<string, string>()
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
}

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
  scheduleTasks: {},
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

describe('mergeSeedWithStored', () => {
  it('returns seed when stored is null', () => {
    const seed = { a: 1, b: 2 }
    expect(mergeSeedWithStored(seed, null)).toEqual(seed)
  })

  it('overlays stored keys onto seed', () => {
    expect(mergeSeedWithStored({ a: 1, b: 2 }, { b: 99 })).toEqual({ a: 1, b: 99 })
  })

  it('preserves seed-only keys (forward-compat for newly added top-level keys)', () => {
    expect(mergeSeedWithStored({ a: 1, b: 2, c: 3 }, { a: 10 })).toEqual({ a: 10, b: 2, c: 3 })
  })

  it('ignores stored keys that are not in seed (avoids leaking removed fields)', () => {
    expect(mergeSeedWithStored({ a: 1 }, { a: 2, b: 99 })).toEqual({ a: 2 })
  })
})

describe('loadInitialState', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('returns seed when storage is empty', () => {
    const seed = minimalSeed()
    expect(loadInitialState(seed, storage)).toEqual(seed)
  })

  it('returns seed when no storage backend is provided', () => {
    const seed = minimalSeed()
    expect(loadInitialState(seed, null)).toEqual(seed)
  })

  it('overlays stored keys onto seed', () => {
    const seed = minimalSeed()
    storage.setItem(STATE_KEY, JSON.stringify({ leads: [{ id: 'LED-001' }] }))
    expect(loadInitialState(seed, storage).leads).toEqual([{ id: 'LED-001' }])
    expect(loadInitialState(seed, storage).projects).toEqual([])
  })

  it('returns seed if stored value is malformed JSON', () => {
    const seed = minimalSeed()
    storage.setItem(STATE_KEY, '{not json')
    expect(loadInitialState(seed, storage)).toEqual(seed)
  })
})

describe('normalizeScheduleTree (4.7-Q2 phase → summary migration)', () => {
  const legacyTask = (id: string, phase: string): ScheduleTask => ({
    id: asId<ScheduleTaskId>(id),
    ccId: asId('CC-001'),
    name: id,
    start: '2026-03-02',
    end: '2026-03-06',
    status: 'upcoming',
    phase,
  })

  it('converts each distinct phase into a top-level summary with its tasks as children', () => {
    const base = {
      ...minimalSeed(),
      scheduleTasks: {
        'PRJ-1': [legacyTask('A', 'Frame'), legacyTask('B', 'Frame'), legacyTask('C', 'Lockup')],
      },
    } as RootState
    const out = normalizeScheduleTree(base)
    const list = out.scheduleTasks['PRJ-1']!

    // Two summaries added; originals re-parented and their phase cleared.
    const summaries = list.filter((t) => !t.parentId)
    expect(summaries.map((s) => s.name).sort()).toEqual(['Frame', 'Lockup'])
    const a = list.find((t) => t.id === ('A' as unknown as ScheduleTaskId))!
    const b = list.find((t) => t.id === ('B' as unknown as ScheduleTaskId))!
    const c = list.find((t) => t.id === ('C' as unknown as ScheduleTaskId))!
    expect(a.parentId).toBeDefined()
    expect(a.parentId).toBe(b.parentId) // same phase → same summary
    expect(c.parentId).not.toBe(a.parentId)
    expect(a.phase).toBeUndefined()
    // Summary is emitted before its first child.
    expect(list.findIndex((t) => t.id === a.parentId)).toBeLessThan(list.indexOf(a))
  })

  it('is idempotent — already-parented tasks are left alone', () => {
    const base = {
      ...minimalSeed(),
      scheduleTasks: { 'PRJ-1': [legacyTask('A', 'Frame')] },
    } as RootState
    const once = normalizeScheduleTree(base)
    const twice = normalizeScheduleTree(once)
    expect(twice.scheduleTasks['PRJ-1']).toEqual(once.scheduleTasks['PRJ-1'])
    expect(twice.scheduleTasks['PRJ-1']).toHaveLength(2)
  })

  it('leaves a project with no legacy phases untouched', () => {
    const tree: ScheduleTask[] = [
      {
        id: asId<ScheduleTaskId>('S'),
        name: 'Group',
        start: '2026-03-02',
        end: '2026-03-06',
        status: 'upcoming',
      },
      { ...legacyTask('A', ''), parentId: asId<ScheduleTaskId>('S'), phase: undefined },
    ]
    const base = { ...minimalSeed(), scheduleTasks: { 'PRJ-1': tree } } as RootState
    expect(normalizeScheduleTree(base).scheduleTasks['PRJ-1']).toEqual(tree)
  })
})

describe('migrateLegacyState', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('skips when sw_state_v2 already exists', () => {
    storage.setItem(STATE_KEY, '{}')
    expect(migrateLegacyState(storage)).toEqual({ status: 'skipped', reason: 'already-migrated' })
  })

  it('skips when no legacy state', () => {
    expect(migrateLegacyState(storage)).toEqual({ status: 'skipped', reason: 'no-legacy' })
  })

  it('skips when legacy is malformed JSON', () => {
    storage.setItem(LEGACY_KEY, '{not json')
    expect(migrateLegacyState(storage).status).toBe('skipped')
    expect(storage.getItem(STATE_KEY)).toBeNull()
  })

  it('migrates legacy state to v2 verbatim', () => {
    const legacy = { projects: [{ id: 'PRJ-001' }], leads: [] }
    storage.setItem(LEGACY_KEY, JSON.stringify(legacy))
    expect(migrateLegacyState(storage)).toEqual({ status: 'migrated' })
    expect(JSON.parse(storage.getItem(STATE_KEY)!)).toEqual(legacy)
  })

  it('leaves legacy key in place after migration (safety net)', () => {
    const legacy = { projects: [{ id: 'PRJ-001' }] }
    storage.setItem(LEGACY_KEY, JSON.stringify(legacy))
    migrateLegacyState(storage)
    expect(storage.getItem(LEGACY_KEY)).not.toBeNull()
  })
})

describe('useReducerPersisted persist-failure signal', () => {
  /** Storage whose writes fail until `healed` is set — simulates quota exceeded. */
  class FlakyStorage extends MemoryStorage {
    healed = false
    setItem(key: string, value: string): void {
      if (!this.healed) throw new DOMException('quota exceeded', 'QuotaExceededError')
      super.setItem(key, value)
    }
  }

  const bump = (state: RootState): RootState => ({
    ...state,
    settings: { ...state.settings, businessName: `${state.settings.businessName ?? ''}x` },
  })

  it('reports no failure while writes succeed', () => {
    const storage = new MemoryStorage()
    const { result } = renderHook(() => useReducerPersisted(bump, minimalSeed(), storage))
    act(() => result.current[1](null))
    expect(result.current[2]).toBe(false)
    expect(storage.getItem(STATE_KEY)).not.toBeNull()
  })

  it('flips persistFailed when setItem throws, and recovers on the next successful write', () => {
    const storage = new FlakyStorage()
    const { result } = renderHook(() => useReducerPersisted(bump, minimalSeed(), storage))

    act(() => result.current[1](null))
    expect(result.current[2]).toBe(true)
    expect(storage.getItem(STATE_KEY)).toBeNull()

    storage.healed = true
    act(() => result.current[1](null))
    expect(result.current[2]).toBe(false)
    expect(storage.getItem(STATE_KEY)).not.toBeNull()
  })

  it('skips the initial mount write (seed never overwrites storage on load)', () => {
    const storage = new MemoryStorage()
    renderHook(() => useReducerPersisted(bump, minimalSeed(), storage))
    expect(storage.getItem(STATE_KEY)).toBeNull()
  })
})
