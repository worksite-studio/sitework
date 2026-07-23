import type { ScheduleTask, ScheduleTaskId } from '@/types'

/**
 * Program-of-works scheduling engine (Phase 4.7-P). Pure functions — no React,
 * no state — so the critical-path maths is unit-testable and ports straight to
 * the Phase 5 backend.
 *
 * Everything works in WORKING days: weekends are always non-working, plus any
 * holiday dates supplied by the calendar. The critical-path maths runs in an
 * integer working-day index space (0 = the project's earliest start) and only
 * converts back to ISO dates at the end, so lead/lag arithmetic stays exact.
 */

export interface WorkCalendar {
  /** ISO (yyyy-mm-dd) dates that are non-working on top of weekends. */
  holidays: ReadonlySet<string>
}

export const DEFAULT_CALENDAR: WorkCalendar = { holidays: new Set<string>() }

// ── ISO date helpers (local midnight, no UTC drift) ────────────────────────

function parse(isoStr: string): Date {
  return new Date(`${isoStr}T00:00:00`)
}

function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isWorking(d: Date, cal: WorkCalendar): boolean {
  const dow = d.getDay() // 0 Sun … 6 Sat
  if (dow === 0 || dow === 6) return false
  return !cal.holidays.has(toISO(d))
}

/** Snap forward to the next working day (returns the same day if already working). */
export function nextWorkingDay(isoStr: string, cal: WorkCalendar = DEFAULT_CALENDAR): string {
  const d = parse(isoStr)
  while (!isWorking(d, cal)) d.setDate(d.getDate() + 1)
  return toISO(d)
}

/**
 * Move `n` working days from `isoStr`, snapping to a working day first. `n` may
 * be negative (a lead). n = 0 just snaps forward to a working day.
 */
export function addWorkingDays(
  isoStr: string,
  n: number,
  cal: WorkCalendar = DEFAULT_CALENDAR,
): string {
  const d = parse(isoStr)
  while (!isWorking(d, cal)) d.setDate(d.getDate() + 1)
  const dir = n >= 0 ? 1 : -1
  for (let i = 0; i < Math.abs(n); i++) {
    do {
      d.setDate(d.getDate() + dir)
    } while (!isWorking(d, cal))
  }
  return toISO(d)
}

/** Count of working days in the inclusive range [aISO, bISO] (0 when b < a). */
export function workingDaysInclusive(
  aISO: string,
  bISO: string,
  cal: WorkCalendar = DEFAULT_CALENDAR,
): number {
  const start = parse(nextWorkingDay(aISO, cal))
  const end = parse(bISO)
  if (start.getTime() > end.getTime()) return 0
  let count = 0
  const cur = new Date(start)
  while (cur.getTime() <= end.getTime()) {
    if (isWorking(cur, cal)) count += 1
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** A task's duration in working days — explicit, else derived from start/end (min 1). */
export function durationWorkingDays(
  task: Pick<ScheduleTask, 'start' | 'end' | 'durationDays'>,
  cal: WorkCalendar = DEFAULT_CALENDAR,
): number {
  if (task.durationDays && task.durationDays > 0) return Math.round(task.durationDays)
  return Math.max(1, workingDaysInclusive(task.start, task.end, cal))
}

/**
 * Signed working-day variance from `fromISO` to `toISO` (4.7-R). Positive means
 * `toISO` is later — i.e. slippage against a baseline; negative means ahead.
 */
export function workingDayVariance(
  fromISO: string,
  toISO: string,
  cal: WorkCalendar = DEFAULT_CALENDAR,
): number {
  if (fromISO === toISO) return 0
  if (toISO > fromISO) return workingDaysInclusive(fromISO, toISO, cal) - 1
  return -(workingDaysInclusive(toISO, fromISO, cal) - 1)
}

/**
 * Duration-weighted percent complete for a summary (4.7-R) — a 20-day task at
 * 50% counts for twice as much as a 10-day task at 50%.
 */
export function rollUpPercent(children: Array<{ duration: number; percent: number }>): number {
  const totalDur = children.reduce((s, c) => s + Math.max(c.duration, 0), 0)
  if (totalDur <= 0) return 0
  const weighted = children.reduce(
    (s, c) => s + Math.max(c.duration, 0) * Math.min(Math.max(c.percent, 0), 100),
    0,
  )
  return Math.round(weighted / totalDur)
}

// ── Critical-path scheduling ───────────────────────────────────────────────

export interface ScheduledTask {
  id: ScheduleTaskId
  /** Computed calendar dates (ISO), honouring anchors + predecessors. */
  start: string
  end: string
  duration: number
  /** Working-day indices from the project epoch. */
  earlyStart: number
  earlyFinish: number
  lateStart: number
  lateFinish: number
  /** Working days of slack (lateStart − earlyStart). */
  totalFloat: number
  critical: boolean
}

export interface ScheduleResult {
  tasks: Map<string, ScheduledTask>
  /** Topological order (predecessors before successors). */
  order: ScheduleTaskId[]
  /** Task ids involved in a dependency cycle — empty when the graph is acyclic. */
  cycle: ScheduleTaskId[]
  /** Project finish (ISO), or null when there are no tasks. */
  projectEnd: string | null
}

/**
 * Compute the schedule: forward + backward CPM pass over the dependency graph,
 * returning per-task computed dates, float and critical flag.
 *
 * A task's stored `start` is a "start no earlier than" anchor; predecessors can
 * push it later. Dependency lag is in working days (negative = lead). If the
 * graph contains a cycle the engine can't order it — it returns the offending
 * ids and falls back to each task's stored dates (no float/critical).
 */
export function computeSchedule(
  input: ScheduleTask[],
  cal: WorkCalendar = DEFAULT_CALENDAR,
): ScheduleResult {
  const tasks = input.filter(Boolean)
  if (tasks.length === 0) return { tasks: new Map(), order: [], cycle: [], projectEnd: null }

  const byId = new Map<string, ScheduleTask>()
  for (const t of tasks) byId.set(t.id as string, t)

  const dur = new Map<string, number>()
  for (const t of tasks) dur.set(t.id as string, durationWorkingDays(t, cal))

  // Epoch = earliest anchor, snapped to a working day. Index 0 = epoch.
  const epoch = nextWorkingDay(
    tasks.reduce((min, t) => (t.start < min ? t.start : min), tasks[0]!.start),
    cal,
  )
  const indexOf = (isoStr: string) =>
    workingDaysInclusive(epoch, nextWorkingDay(isoStr, cal), cal) - 1
  const dateFromIndex = (k: number) => addWorkingDays(epoch, k, cal)

  // Predecessors (from deps) and successors (reverse), keeping only real links.
  const preds = new Map<string, { id: string; type: string; lag: number }[]>()
  const succs = new Map<string, { id: string; type: string; lag: number }[]>()
  for (const t of tasks) {
    const list = (t.deps ?? []).filter(
      (d) => byId.has(d.id as string) && (d.id as string) !== (t.id as string),
    )
    preds.set(
      t.id as string,
      list.map((d) => ({ id: d.id as string, type: d.type, lag: d.lag })),
    )
    for (const d of list) {
      const arr = succs.get(d.id as string) ?? []
      arr.push({ id: t.id as string, type: d.type, lag: d.lag })
      succs.set(d.id as string, arr)
    }
  }

  // Kahn topological sort.
  const indeg = new Map<string, number>()
  for (const t of tasks) indeg.set(t.id as string, preds.get(t.id as string)!.length)
  const queue = tasks.filter((t) => indeg.get(t.id as string) === 0).map((t) => t.id as string)
  const order: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const s of succs.get(id) ?? []) {
      indeg.set(s.id, indeg.get(s.id)! - 1)
      if (indeg.get(s.id) === 0) queue.push(s.id)
    }
  }

  if (order.length < tasks.length) {
    // Cycle — bail out, fall back to stored dates.
    const cycle = tasks.map((t) => t.id as string).filter((id) => !order.includes(id))
    const fallback = new Map<string, ScheduledTask>()
    for (const t of tasks) {
      const d = dur.get(t.id as string)!
      fallback.set(t.id as string, {
        id: t.id,
        start: nextWorkingDay(t.start, cal),
        end: addWorkingDays(nextWorkingDay(t.start, cal), d - 1, cal),
        duration: d,
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        totalFloat: 0,
        critical: false,
      })
    }
    return {
      tasks: fallback,
      order: order as unknown as ScheduleTaskId[],
      cycle: cycle as unknown as ScheduleTaskId[],
      projectEnd: null,
    }
  }

  // Forward pass — early start / early finish (indices).
  const ES = new Map<string, number>()
  const EF = new Map<string, number>()
  for (const id of order) {
    const d = dur.get(id)!
    let es = indexOf(byId.get(id)!.start)
    for (const p of preds.get(id)!) {
      const pes = ES.get(p.id)!
      const pef = EF.get(p.id)!
      let cand: number
      switch (p.type) {
        case 'SS':
          cand = pes + p.lag
          break
        case 'FF':
          cand = pef + p.lag - (d - 1)
          break
        case 'SF':
          cand = pes + p.lag - (d - 1)
          break
        case 'FS':
        default:
          cand = pef + 1 + p.lag
          break
      }
      if (cand > es) es = cand
    }
    ES.set(id, es)
    EF.set(id, es + d - 1)
  }

  const projectEndIdx = Math.max(...order.map((id) => EF.get(id)!))

  // Backward pass — late finish / late start (indices).
  const LF = new Map<string, number>()
  const LS = new Map<string, number>()
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]!
    const d = dur.get(id)!
    let lf = projectEndIdx
    for (const s of succs.get(id) ?? []) {
      const sls = LS.get(s.id)!
      const slf = LF.get(s.id)!
      let cand: number
      switch (s.type) {
        case 'SS':
          cand = sls - s.lag + (d - 1)
          break
        case 'FF':
          cand = slf - s.lag
          break
        case 'SF':
          cand = slf - s.lag + (d - 1)
          break
        case 'FS':
        default:
          cand = sls - 1 - s.lag
          break
      }
      if (cand < lf) lf = cand
    }
    LF.set(id, lf)
    LS.set(id, lf - d + 1)
  }

  const out = new Map<string, ScheduledTask>()
  for (const t of tasks) {
    const id = t.id as string
    const es = ES.get(id)!
    const ef = EF.get(id)!
    const ls = LS.get(id)!
    const lf = LF.get(id)!
    const totalFloat = ls - es
    out.set(id, {
      id: t.id,
      start: dateFromIndex(es),
      end: dateFromIndex(ef),
      duration: dur.get(id)!,
      earlyStart: es,
      earlyFinish: ef,
      lateStart: ls,
      lateFinish: lf,
      totalFloat,
      critical: totalFloat <= 0,
    })
  }

  return {
    tasks: out,
    order: order as unknown as ScheduleTaskId[],
    cycle: [],
    projectEnd: dateFromIndex(projectEndIdx),
  }
}
