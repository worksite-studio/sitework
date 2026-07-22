import { describe, it, expect } from 'vitest'
import {
  addWorkingDays,
  computeSchedule,
  durationWorkingDays,
  nextWorkingDay,
  workingDaysInclusive,
  type WorkCalendar,
} from './schedule'
import { asId } from '@/types'
import type { ScheduleTask, ScheduleTaskId, TaskDependency } from '@/types'

// Anchor dates: 2026-06-01 is a Monday.
const MON = '2026-06-01'
const TUE = '2026-06-02'
const WED = '2026-06-03'
const THU = '2026-06-04'
const FRI = '2026-06-05'
const SAT = '2026-06-06'
const NEXT_MON = '2026-06-08'

function task(
  id: string,
  start: string,
  opts: Partial<ScheduleTask> & { durationDays?: number; deps?: TaskDependency[] } = {},
): ScheduleTask {
  return {
    id: asId<ScheduleTaskId>(id),
    ccId: asId('CC-001'),
    name: id,
    start,
    end: opts.end ?? start,
    status: 'upcoming',
    ...opts,
  }
}
const dep = (id: string, type: TaskDependency['type'] = 'FS', lag = 0): TaskDependency => ({
  id: asId<ScheduleTaskId>(id),
  type,
  lag,
})

describe('working-day calendar helpers', () => {
  it('addWorkingDays steps over weekends', () => {
    expect(addWorkingDays(FRI, 1)).toBe(NEXT_MON)
    expect(addWorkingDays(MON, 4)).toBe(FRI)
    expect(addWorkingDays(MON, 5)).toBe(NEXT_MON)
  })

  it('addWorkingDays snaps a weekend start forward (n = 0)', () => {
    expect(addWorkingDays(SAT, 0)).toBe(NEXT_MON)
    expect(nextWorkingDay(SAT)).toBe(NEXT_MON)
  })

  it('addWorkingDays goes backwards for a lead', () => {
    expect(addWorkingDays(NEXT_MON, -1)).toBe(FRI)
  })

  it('workingDaysInclusive excludes the weekend', () => {
    expect(workingDaysInclusive(MON, '2026-06-07')).toBe(5) // Mon–Fri
    expect(workingDaysInclusive(MON, FRI)).toBe(5)
    expect(workingDaysInclusive(MON, MON)).toBe(1)
  })

  it('honours holidays on top of weekends', () => {
    const cal: WorkCalendar = { holidays: new Set([WED]) }
    // Mon +2 working days, skipping Wed → Thu
    expect(addWorkingDays(MON, 2, cal)).toBe(THU)
    expect(workingDaysInclusive(MON, FRI, cal)).toBe(4) // Wed removed
  })

  it('derives duration from start/end when durationDays is absent', () => {
    expect(durationWorkingDays({ start: MON, end: FRI })).toBe(5)
    expect(durationWorkingDays({ start: MON, end: FRI, durationDays: 3 })).toBe(3)
    expect(durationWorkingDays({ start: MON, end: MON })).toBe(1)
  })
})

describe('computeSchedule — dependency types', () => {
  it('FS: successor starts the working day after the predecessor finishes', () => {
    const A = task('A', MON, { durationDays: 3 }) // Mon–Wed
    const B = task('B', MON, { durationDays: 2, deps: [dep('A', 'FS', 0)] })
    const r = computeSchedule([A, B])
    expect(r.cycle).toEqual([])
    expect(r.tasks.get('A')!.start).toBe(MON)
    expect(r.tasks.get('A')!.end).toBe(WED)
    expect(r.tasks.get('B')!.start).toBe(THU)
    expect(r.tasks.get('B')!.end).toBe(FRI)
  })

  it('FS with lag pushes the successor by working days', () => {
    const A = task('A', MON, { durationDays: 3 }) // ends Wed
    const B = task('B', MON, { durationDays: 1, deps: [dep('A', 'FS', 2)] })
    // Thu + 2 lag → Thu, Fri, Mon = start Mon 08
    expect(computeSchedule([A, B]).tasks.get('B')!.start).toBe(NEXT_MON)
  })

  it('SS: successor starts lag days after the predecessor starts', () => {
    const A = task('A', MON, { durationDays: 3 })
    const B = task('B', MON, { durationDays: 2, deps: [dep('A', 'SS', 1)] })
    expect(computeSchedule([A, B]).tasks.get('B')!.start).toBe(TUE)
  })

  it('FF: successor finishes with the predecessor', () => {
    const A = task('A', MON, { durationDays: 3 }) // ends Wed
    const B = task('B', MON, { durationDays: 2, deps: [dep('A', 'FF', 0)] })
    const b = computeSchedule([A, B]).tasks.get('B')!
    expect(b.end).toBe(WED)
    expect(b.start).toBe(TUE) // 2-day task finishing Wed starts Tue
  })

  it('the anchor start wins when it is later than the dependency', () => {
    const A = task('A', MON, { durationDays: 2 })
    const B = task('B', '2026-06-15', { durationDays: 1, deps: [dep('A', 'FS', 0)] })
    expect(computeSchedule([A, B]).tasks.get('B')!.start).toBe('2026-06-15')
  })
})

describe('computeSchedule — critical path & float', () => {
  it('flags the critical chain and gives parallel slack float', () => {
    const A = task('A', MON, { durationDays: 3 }) // ES0 EF2
    const B = task('B', MON, { durationDays: 2, deps: [dep('A', 'FS', 0)] }) // ES3 EF4
    const C = task('C', MON, { durationDays: 1 }) // parallel, no deps/successors
    const r = computeSchedule([A, B, C])
    expect(r.tasks.get('A')!.critical).toBe(true)
    expect(r.tasks.get('B')!.critical).toBe(true)
    expect(r.tasks.get('C')!.critical).toBe(false)
    expect(r.tasks.get('A')!.totalFloat).toBe(0)
    expect(r.tasks.get('C')!.totalFloat).toBe(4) // project runs to index 4
    expect(r.projectEnd).toBe(addWorkingDays(MON, 4))
  })
})

describe('computeSchedule — robustness', () => {
  it('detects a dependency cycle and falls back to stored dates', () => {
    const A = task('A', MON, { durationDays: 2, deps: [dep('B', 'FS', 0)] })
    const B = task('B', TUE, { durationDays: 2, deps: [dep('A', 'FS', 0)] })
    const r = computeSchedule([A, B])
    expect(r.cycle.length).toBe(2)
    expect(r.projectEnd).toBeNull()
    // Still returns positioned tasks so the Gantt can render something.
    expect(r.tasks.get('A')!.start).toBe(MON)
  })

  it('ignores dangling and self dependencies', () => {
    const A = task('A', MON, { durationDays: 2, deps: [dep('A'), dep('ZZ')] })
    const r = computeSchedule([A])
    expect(r.cycle).toEqual([])
    expect(r.tasks.get('A')!.start).toBe(MON)
  })

  it('returns empty for no tasks', () => {
    const r = computeSchedule([])
    expect(r.tasks.size).toBe(0)
    expect(r.projectEnd).toBeNull()
  })
})
