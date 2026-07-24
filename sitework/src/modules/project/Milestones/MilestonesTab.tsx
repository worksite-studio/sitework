import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Dialog, Field, Input, Select, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import {
  addWorkingDays,
  computeSchedule,
  durationWorkingDays,
  rollUpPercent,
  workingDayVariance,
} from '@/lib/schedule'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { CostCodeSelect } from '../CostCodeSelect'
import { asId } from '@/types'
import type {
  CostCodeId,
  DependencyType,
  Milestone,
  MilestoneId,
  MilestoneStatus,
  ScheduleTask,
  ScheduleTaskId,
  TaskDependency,
} from '@/types'
import { newId } from '@/lib/newId'

const DAY_MS = 86_400_000
const LOOKAHEAD_DAYS = 42
const DEP_TYPES: DependencyType[] = ['FS', 'SS', 'FF', 'SF']
const ROW_H = 40
const AXIS_H = 28
const GRID_W = 684

function parseISO(s: string): Date {
  return new Date(`${s}T00:00:00`)
}
function statusColor(status: MilestoneStatus): string {
  if (status === 'complete') return 'var(--sw-pos)'
  if (status === 'in-progress') return 'var(--sw-ink)'
  if (status === 'delayed') return 'var(--sw-neg)'
  return 'var(--sw-faint)'
}
/** Summary status rolled up from its children. */
function rollUpStatus(kids: MilestoneStatus[]): MilestoneStatus {
  if (kids.length === 0) return 'upcoming'
  if (kids.every((s) => s === 'complete')) return 'complete'
  if (kids.some((s) => s === 'delayed')) return 'delayed'
  if (kids.some((s) => s === 'in-progress' || s === 'complete')) return 'in-progress'
  return 'upcoming'
}

interface Resolved {
  start: string
  end: string
  duration: number
  critical: boolean
  status: MilestoneStatus
  float: number
  /** Work complete 0–100 — leaf value, or duration-weighted roll-up. */
  percent: number
  /** Baseline finish, when a baseline has been taken. */
  baselineStart?: string
  baselineEnd?: string
  /** Working days late (+) / early (−) against the baseline finish. */
  slip?: number
}

/**
 * Program of Works — cost-code Gantt with a critical-path engine (4.7-P) and a
 * WBS split-grid (4.7-Q2).
 *
 * The programme is a tree of `ScheduleTask`s (`parentId`). A row with children
 * is a SUMMARY: its dates / duration / status roll up from its descendants and
 * it renders as a roll-up bar; a leaf row books to a cost code and is scheduled
 * by the pure engine (`@/lib/schedule`) over typed dependencies (FS/SS/FF/SF +
 * lag) on a working-day calendar. The left grid is an editable MS-Project-style
 * register (WBS · Name · Duration · Start · Finish · Predecessors) with
 * indent/outdent and collapsible summaries; the right chart shows the bars,
 * milestone diamonds and dependency arrows, aligned row-for-row.
 */
export function MilestonesTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [msModal, setMsModal] = useState<'new' | { milestone: Milestone } | null>(null)
  const [taskModal, setTaskModal] = useState<
    'new-task' | 'new-group' | { task: ScheduleTask } | null
  >(null)
  const [view, setView] = useState<'full' | 'lookahead'>('full')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const pid = project?.id as string | undefined
  const tasks: ScheduleTask[] = useMemo(
    () => (pid ? (state.scheduleTasks[pid] ?? []) : []),
    [state.scheduleTasks, pid],
  )
  const milestones: Milestone[] = useMemo(
    () => (pid ? (state.milestones[pid] ?? []) : []),
    [state.milestones, pid],
  )

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartW, setChartW] = useState(0)
  useEffect(() => {
    const el = chartRef.current
    if (!el) return
    const update = () => setChartW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  })

  // ── Tree + schedule ────────────────────────────────────────────────────
  const { rows, resolved, arrowsData, wbsById } = useMemo(() => {
    const byId = new Map(tasks.map((t) => [t.id as string, t]))
    const childrenOf = new Map<string, ScheduleTask[]>()
    const roots: ScheduleTask[] = []
    for (const t of tasks) {
      const parent = t.parentId
        ? byId.get(t.parentId as string)
          ? (t.parentId as string)
          : null
        : null
      if (parent) childrenOf.set(parent, [...(childrenOf.get(parent) ?? []), t])
      else roots.push(t)
    }
    const isSummary = (t: ScheduleTask) => (childrenOf.get(t.id as string)?.length ?? 0) > 0
    const leaves = tasks.filter((t) => !isSummary(t))
    const sched = computeSchedule(leaves)

    const resolved = new Map<string, Resolved>()
    for (const leaf of leaves) {
      const s = sched.tasks.get(leaf.id as string)
      const end = s?.end ?? leaf.end
      resolved.set(leaf.id as string, {
        start: s?.start ?? leaf.start,
        end,
        duration: s?.duration ?? durationWorkingDays(leaf),
        critical: s?.critical ?? false,
        status: leaf.status,
        float: s?.totalFloat ?? 0,
        percent: Math.min(Math.max(leaf.percentComplete ?? 0, 0), 100),
        baselineStart: leaf.baselineStart,
        baselineEnd: leaf.baselineEnd,
        slip: leaf.baselineEnd ? workingDayVariance(leaf.baselineEnd, end) : undefined,
      })
    }
    const resolveNode = (t: ScheduleTask): Resolved => {
      const existing = resolved.get(t.id as string)
      if (existing) return existing
      const kids = childrenOf.get(t.id as string) ?? []
      const kr = kids.map(resolveNode)
      const start = kr.reduce((m, r) => (r.start < m ? r.start : m), kr[0]?.start ?? t.start)
      const end = kr.reduce((m, r) => (r.end > m ? r.end : m), kr[0]?.end ?? t.end)
      // Baseline span rolls up too, so a summary shows its own slippage.
      const bStarts = kr.map((x) => x.baselineStart).filter(Boolean) as string[]
      const bEnds = kr.map((x) => x.baselineEnd).filter(Boolean) as string[]
      const baselineStart = bStarts.length ? bStarts.reduce((m, d) => (d < m ? d : m)) : undefined
      const baselineEnd = bEnds.length ? bEnds.reduce((m, d) => (d > m ? d : m)) : undefined
      const r: Resolved = {
        start,
        end,
        duration: durationWorkingDays({ start, end }),
        critical: kr.some((x) => x.critical),
        status: rollUpStatus(kr.map((x) => x.status)),
        float: 0,
        percent: rollUpPercent(kr.map((x) => ({ duration: x.duration, percent: x.percent }))),
        baselineStart,
        baselineEnd,
        slip: baselineEnd ? workingDayVariance(baselineEnd, end) : undefined,
      }
      resolved.set(t.id as string, r)
      return r
    }
    for (const t of tasks) if (isSummary(t)) resolveNode(t)

    // Depth-first visible-row list + WBS numbering.
    type Row = { task: ScheduleTask; depth: number; wbs: string; isSummary: boolean }
    const rows: Row[] = []
    const wbsById = new Map<string, string>()
    const walk = (list: ScheduleTask[], depth: number, prefix: string) => {
      list.forEach((t, i) => {
        const wbs = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
        wbsById.set(t.id as string, wbs)
        const kids = childrenOf.get(t.id as string) ?? []
        rows.push({ task: t, depth, wbs, isSummary: kids.length > 0 })
        if (kids.length > 0 && !collapsed.has(t.id as string)) walk(kids, depth + 1, wbs)
      })
    }
    walk(roots, 0, '')

    return { rows, resolved, wbsById, arrowsData: sched }
  }, [tasks, collapsed])

  // Positions for the arrow overlay (depends on window + measured width).
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const win = useMemo(() => {
    if (view === 'lookahead') {
      return { start: today.getTime(), end: today.getTime() + LOOKAHEAD_DAYS * DAY_MS }
    }
    const stamps: number[] = []
    for (const r of rows) {
      const res = resolved.get(r.task.id as string)
      if (res) stamps.push(parseISO(res.start).getTime(), parseISO(res.end).getTime())
    }
    for (const m of milestones) stamps.push(parseISO(m.date).getTime())
    if (stamps.length === 0) return null
    return { start: Math.min(...stamps) - 3 * DAY_MS, end: Math.max(...stamps) + 3 * DAY_MS }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, resolved, milestones, view])

  if (!project) return null

  const span = win ? win.end - win.start : 1
  const pct = (ms: number) => ((ms - (win?.start ?? 0)) / span) * 100
  const clamp = (n: number) => Math.max(0, Math.min(100, n))
  const rowsHeight = rows.length * ROW_H

  // Row centre Ys + bar extents for arrows.
  const pos = new Map<
    string,
    { centerY: number; startPct: number; endPct: number; critical: boolean }
  >()
  rows.forEach((r, i) => {
    const res = resolved.get(r.task.id as string)
    if (!res) return
    pos.set(r.task.id as string, {
      centerY: i * ROW_H + ROW_H / 2,
      startPct: clamp(pct(parseISO(res.start).getTime())),
      endPct: clamp(pct(parseISO(res.end).getTime())),
      critical: res.critical,
    })
  })
  const xOf = (p: number) => (p / 100) * chartW
  const arrows: Array<{ key: string; d: string; critical: boolean }> = []
  if (chartW > 0) {
    for (const r of rows) {
      const sp = pos.get(r.task.id as string)
      if (!sp) continue
      for (const d of r.task.deps ?? []) {
        const pp = pos.get(d.id as string)
        if (!pp) continue
        let sPct: number
        let tPct: number
        switch (d.type) {
          case 'SS':
            sPct = pp.startPct
            tPct = sp.startPct
            break
          case 'FF':
            sPct = pp.endPct
            tPct = sp.endPct
            break
          case 'SF':
            sPct = pp.startPct
            tPct = sp.endPct
            break
          default:
            sPct = pp.endPct
            tPct = sp.startPct
        }
        const x1 = xOf(sPct)
        const x2 = xOf(tPct)
        const outX = x1 + (x2 >= x1 ? 8 : -8)
        arrows.push({
          key: `${d.id}->${r.task.id as string}`,
          d: `M ${x1} ${pp.centerY} H ${outX} V ${sp.centerY} H ${x2}`,
          critical: pp.critical && sp.critical,
        })
      }
    }
  }

  const ticks: Array<{ left: number; label: string }> = []
  if (win) {
    const cur = new Date(win.start)
    cur.setDate(1)
    cur.setHours(0, 0, 0, 0)
    while (cur.getTime() <= win.end) {
      if (cur.getTime() >= win.start) {
        ticks.push({
          left: pct(cur.getTime()),
          label: cur.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
        })
      }
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  const todayInWindow = !!win && today.getTime() >= win.start && today.getTime() <= win.end
  const criticalCount = [...resolved.entries()].filter(
    ([id, r]) => r.critical && !rows.find((x) => x.task.id === id)?.isSummary,
  ).length

  // ── Tree editing ─────────────────────────────────────────────────────────
  const siblingsOf = (t: ScheduleTask): ScheduleTask[] => {
    const parentId = t.parentId ?? null
    return tasks.filter((x) => (x.parentId ?? null) === parentId)
  }
  const indent = (t: ScheduleTask) => {
    const sibs = siblingsOf(t)
    const idx = sibs.findIndex((s) => s.id === t.id)
    if (idx <= 0) return
    dispatch({
      type: 'UPDATE_SCHEDULE_TASK',
      projectId: project.id,
      taskId: t.id,
      patch: { parentId: sibs[idx - 1]!.id },
    })
  }
  const outdent = (t: ScheduleTask) => {
    if (!t.parentId) return
    const parent = tasks.find((x) => x.id === t.parentId)
    dispatch({
      type: 'UPDATE_SCHEDULE_TASK',
      projectId: project.id,
      taskId: t.id,
      patch: { parentId: parent?.parentId },
    })
  }
  const toggleCollapse = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function deleteTask(t: ScheduleTask) {
    if (!project) return
    const kids = tasks.filter((x) => x.parentId === t.id)
    const ok = await confirm({
      title: kids.length ? 'Remove group' : 'Remove from programme',
      message: kids.length
        ? `Remove "${t.name}"? Its ${kids.length} task${kids.length > 1 ? 's' : ''} move up a level; the cost codes are untouched.`
        : `Remove "${t.name}" from the programme? The cost code itself is untouched.`,
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    for (const k of kids) {
      dispatch({
        type: 'UPDATE_SCHEDULE_TASK',
        projectId: project.id,
        taskId: k.id,
        patch: { parentId: t.parentId },
      })
    }
    dispatch({ type: 'DELETE_SCHEDULE_TASK', projectId: project.id, taskId: t.id })
    toast('Removed from programme', 'success')
  }

  const patchTask = (t: ScheduleTask, patch: Partial<ScheduleTask>) =>
    dispatch({ type: 'UPDATE_SCHEDULE_TASK', projectId: project.id, taskId: t.id, patch })

  // ── Baseline (4.7-R) ─────────────────────────────────────────────────────
  const hasBaseline = tasks.some((t) => !!t.baselineEnd)
  // Programme slippage = the latest computed finish vs the latest baseline finish.
  const latestEnd = rows.reduce<string | null>((m, r) => {
    const e = resolved.get(r.task.id as string)?.end
    return e && (!m || e > m) ? e : m
  }, null)
  const latestBaseline = tasks.reduce<string | null>(
    (m, t) => (t.baselineEnd && (!m || t.baselineEnd > m) ? t.baselineEnd : m),
    null,
  )
  const programmeSlip =
    latestEnd && latestBaseline ? workingDayVariance(latestBaseline, latestEnd) : null

  async function setBaseline() {
    if (!project) return
    if (hasBaseline) {
      const ok = await confirm({
        title: 'Re-baseline programme',
        message:
          'Replace the approved baseline with the current dates? The existing baseline — and the slippage measured against it — will be lost.',
        confirmLabel: 'Re-baseline',
        danger: true,
      })
      if (!ok) return
    }
    const baselines: Record<string, { start: string; end: string }> = {}
    for (const t of tasks) {
      const r = resolved.get(t.id as string)
      if (r) baselines[t.id as string] = { start: r.start, end: r.end }
    }
    dispatch({ type: 'SET_SCHEDULE_BASELINE', projectId: project.id, baselines })
    toast(hasBaseline ? 'Programme re-baselined' : 'Baseline set', 'success')
  }

  const empty = rows.length === 0 && milestones.length === 0

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Program of Works
          </h2>
          <div className="text-[13px] text-sw-dim">
            {rows.length} row{rows.length !== 1 ? 's' : ''} · {criticalCount} on critical path ·{' '}
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
            {programmeSlip !== null && (
              <>
                {' · '}
                <span
                  style={{ color: programmeSlip > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)' }}
                  className="font-semibold"
                >
                  {programmeSlip > 0
                    ? `${programmeSlip} days behind baseline`
                    : programmeSlip < 0
                      ? `${Math.abs(programmeSlip)} days ahead of baseline`
                      : 'on baseline'}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-1 flex">
            {(['full', 'lookahead'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className="cursor-pointer px-3 py-[5px] text-[12px]"
                style={{
                  border: `1px solid ${view === v ? 'var(--sw-ink)' : 'var(--sw-rule)'}`,
                  background: view === v ? 'var(--sw-ink)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--sw-dim)',
                }}
              >
                {v === 'full' ? 'Full programme' : '6-week lookahead'}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={setBaseline} disabled={rows.length === 0}>
            {hasBaseline ? 'Re-baseline' : 'Set baseline'}
          </Button>
          <Button variant="secondary" onClick={() => setMsModal('new')}>
            + Milestone
          </Button>
          <Button variant="secondary" onClick={() => setTaskModal('new-group')}>
            + Group
          </Button>
          <Button onClick={() => setTaskModal('new-task')} disabled={project.codes.length === 0}>
            + Task
          </Button>
        </div>
      </header>

      {arrowsData.cycle.length > 0 && (
        <div className="mb-4 rounded-[1px] border border-sw-neg bg-sw-neg-bg px-4 py-2.5 text-[12px] text-sw-neg">
          A dependency loop was found between {arrowsData.cycle.length} tasks — the programme can't
          be scheduled until it's broken. Bars fall back to their saved dates.
        </div>
      )}

      {empty ? (
        <div className="border-y border-sw-rule py-14 text-center text-[13px] text-sw-faint">
          No programme yet — add a task to place a cost code on the timeline, or a group heading to
          structure it.
        </div>
      ) : (
        <div className="flex overflow-x-auto border-t border-sw-ink">
          {/* ── Grid pane ─────────────────────────────────────────────── */}
          <div className="shrink-0" style={{ width: GRID_W }}>
            <div
              className="flex items-center border-b border-sw-rule bg-white text-[9px] font-semibold uppercase tracking-[0.08em] text-sw-dim"
              style={{ height: AXIS_H }}
            >
              <span className="shrink-0 pl-2" style={{ width: 44 }}>
                WBS
              </span>
              <span className="flex-1">Task</span>
              <span className="shrink-0 text-right" style={{ width: 44 }}>
                Dur
              </span>
              <span className="shrink-0 pr-1 text-right" style={{ width: 48 }}>
                Float
              </span>
              <span className="shrink-0 pr-1 text-right" style={{ width: 44 }}>
                %
              </span>
              <span className="shrink-0 pr-1 text-right" style={{ width: 48 }}>
                Slip
              </span>
              <span className="shrink-0 pl-2" style={{ width: 96 }}>
                Start
              </span>
              <span className="shrink-0 pl-2" style={{ width: 96 }}>
                Finish
              </span>
              <span className="shrink-0 pl-2" style={{ width: 56 }}>
                Pred
              </span>
            </div>
            {/* Milestone spacer row aligns with the chart's diamond row */}
            <div
              className="flex items-center border-b border-sw-rule-l pl-2 text-[11px] font-semibold text-sw-dim"
              style={{ height: ROW_H }}
            >
              Milestones
            </div>
            {rows.map((r) => {
              const res = resolved.get(r.task.id as string)!
              const isSum = r.isSummary
              const preds = (r.task.deps ?? [])
                .map((d) => wbsById.get(d.id as string))
                .filter(Boolean)
                .join(', ')
              return (
                <div
                  key={r.task.id as string}
                  className="group/row flex items-center border-b border-sw-rule-l hover:bg-sw-muted/5"
                  style={{ height: ROW_H }}
                >
                  <span
                    className="shrink-0 pl-2 font-mono text-[10px] text-sw-faint"
                    style={{ width: 44 }}
                  >
                    {r.wbs}
                  </span>
                  <span
                    className="flex min-w-0 flex-1 items-center gap-1"
                    style={{ paddingLeft: r.depth * 14 }}
                  >
                    {isSum ? (
                      <button
                        type="button"
                        onClick={() => toggleCollapse(r.task.id as string)}
                        aria-label={collapsed.has(r.task.id as string) ? 'Expand' : 'Collapse'}
                        className="w-3 shrink-0 text-[9px] text-sw-dim"
                      >
                        {collapsed.has(r.task.id as string) ? '▸' : '▾'}
                      </button>
                    ) : (
                      <span className="w-3 shrink-0" />
                    )}
                    <input
                      value={r.task.name}
                      onChange={(e) => patchTask(r.task, { name: e.target.value })}
                      aria-label={`Name ${r.wbs}`}
                      className={`min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-[12px] focus:outline-none ${isSum ? 'font-bold text-sw-ink' : 'font-medium text-sw-ink'}`}
                    />
                  </span>
                  <span
                    className="shrink-0 text-right text-[11px] text-sw-dim"
                    style={{ width: 44 }}
                  >
                    {res.duration}d
                  </span>
                  <span
                    className="shrink-0 pr-1 text-right text-[11px]"
                    style={{
                      width: 48,
                      color: res.critical ? 'var(--sw-neg)' : 'var(--sw-faint)',
                      fontWeight: res.critical ? 600 : 400,
                    }}
                    title={res.critical ? 'On the critical path — no slack' : 'Total slack'}
                  >
                    {isSum ? '—' : `${res.float}d`}
                  </span>
                  <span className="shrink-0 pr-1 text-right" style={{ width: 44 }}>
                    {isSum ? (
                      <span className="text-[11px] text-sw-dim">{res.percent}%</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={res.percent}
                        onChange={(e) =>
                          patchTask(r.task, {
                            percentComplete: Math.min(
                              Math.max(Math.round(Number(e.target.value) || 0), 0),
                              100,
                            ),
                          })
                        }
                        aria-label={`Percent ${r.wbs}`}
                        className="w-full border-0 bg-transparent p-0 text-right text-[11px] text-sw-dim focus:outline-none"
                      />
                    )}
                  </span>
                  <span
                    className="shrink-0 pr-1 text-right text-[11px]"
                    style={{
                      width: 48,
                      color:
                        res.slip === undefined
                          ? 'var(--sw-faint)'
                          : res.slip > 0
                            ? 'var(--sw-neg)'
                            : 'var(--sw-pos)',
                      fontWeight: res.slip && res.slip > 0 ? 600 : 400,
                    }}
                    title={
                      res.baselineEnd
                        ? `Baseline finish ${formatDate(res.baselineEnd)}`
                        : 'No baseline set'
                    }
                  >
                    {res.slip === undefined ? '—' : res.slip > 0 ? `+${res.slip}d` : `${res.slip}d`}
                  </span>
                  <span className="shrink-0 pl-2" style={{ width: 96 }}>
                    {isSum ? (
                      <span className="text-[11px] text-sw-faint">{formatDate(res.start)}</span>
                    ) : (
                      <input
                        type="date"
                        value={r.task.start}
                        onChange={(e) => patchTask(r.task, { start: e.target.value })}
                        aria-label={`Start ${r.wbs}`}
                        className="w-full border-0 bg-transparent p-0 text-[11px] text-sw-dim focus:outline-none"
                      />
                    )}
                  </span>
                  <span className="shrink-0 pl-2 text-[11px] text-sw-faint" style={{ width: 96 }}>
                    {formatDate(res.end)}
                  </span>
                  <span
                    className="flex shrink-0 items-center gap-1 pl-2 text-[11px] text-sw-dim"
                    style={{ width: 56 }}
                  >
                    <button
                      type="button"
                      onClick={() => setTaskModal({ task: r.task })}
                      className="truncate text-left hover:text-sw-ink hover:underline"
                      title="Edit task"
                    >
                      {preds || (isSum ? '—' : '+')}
                    </button>
                    <span className="ml-auto hidden shrink-0 items-center group-hover/row:flex">
                      <button
                        type="button"
                        onClick={() => outdent(r.task)}
                        aria-label={`Outdent ${r.wbs}`}
                        className="px-[2px] text-[11px] text-sw-faint hover:text-sw-ink"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => indent(r.task)}
                        aria-label={`Indent ${r.wbs}`}
                        className="px-[2px] text-[11px] text-sw-faint hover:text-sw-ink"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTask(r.task)}
                        aria-label={`Remove ${r.task.name}`}
                        className="px-[2px] text-[11px] text-sw-danger"
                      >
                        ×
                      </button>
                    </span>
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Chart pane ────────────────────────────────────────────── */}
          <div className="min-w-[360px] flex-1 border-l border-sw-rule">
            {/* Month axis */}
            <div className="relative border-b border-sw-rule" style={{ height: AXIS_H }}>
              {ticks.map((t) => (
                <span
                  key={t.label + t.left}
                  className="absolute top-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-sw-faint"
                  style={{ left: `${clamp(t.left)}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
            {/* Milestone diamonds */}
            <div className="relative border-b border-sw-rule-l" style={{ height: ROW_H }}>
              {milestones.map((m) => (
                <span
                  key={m.id as string}
                  title={`${m.name} · ${formatDate(m.date)}`}
                  className="absolute top-1/2"
                  style={{
                    left: `${clamp(pct(parseISO(m.date).getTime()))}%`,
                    transform: 'translate(-50%, -50%) rotate(45deg)',
                    width: 9,
                    height: 9,
                    background: statusColor(m.status),
                  }}
                />
              ))}
            </div>
            {/* Bars + arrows */}
            <div ref={chartRef} className="relative" style={{ height: rowsHeight }}>
              {arrows.length > 0 && (
                <svg
                  className="pointer-events-none absolute inset-0 z-10"
                  width={chartW}
                  height={rowsHeight}
                  aria-hidden="true"
                >
                  <defs>
                    {(['pw-arrow', 'pw-arrow-crit'] as const).map((mid) => (
                      <marker
                        key={mid}
                        id={mid}
                        markerWidth="7"
                        markerHeight="7"
                        refX="5.5"
                        refY="3"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path
                          d="M0,0 L6,3 L0,6 z"
                          fill={mid === 'pw-arrow-crit' ? 'var(--sw-neg)' : 'var(--sw-faint)'}
                        />
                      </marker>
                    ))}
                  </defs>
                  {arrows.map((a) => (
                    <path
                      key={a.key}
                      d={a.d}
                      fill="none"
                      stroke={a.critical ? 'var(--sw-neg)' : 'var(--sw-faint)'}
                      strokeWidth={a.critical ? 1.5 : 1.25}
                      markerEnd={`url(#${a.critical ? 'pw-arrow-crit' : 'pw-arrow'})`}
                    />
                  ))}
                </svg>
              )}
              {rows.map((r) => {
                const res = resolved.get(r.task.id as string)!
                const left = clamp(pct(parseISO(res.start).getTime()))
                const width = Math.max(clamp(pct(parseISO(res.end).getTime())) - left, 0.6)
                const color = statusColor(res.status)
                return (
                  <div
                    key={r.task.id as string}
                    className="relative border-b border-sw-rule-l"
                    style={{ height: ROW_H }}
                  >
                    {r.isSummary ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${formatDate(res.start)} → ${formatDate(res.end)}`}
                      >
                        <div className="h-[4px] w-full" style={{ background: 'var(--sw-ink)' }} />
                        <div className="flex justify-between">
                          <span
                            className="h-[5px] w-[2px]"
                            style={{ background: 'var(--sw-ink)' }}
                          />
                          <span
                            className="h-[5px] w-[2px]"
                            style={{ background: 'var(--sw-ink)' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        title={`${formatDate(res.start)} → ${formatDate(res.end)} · ${res.percent}% complete${res.critical ? ' · critical path' : ` · ${res.float}d float`}${res.slip !== undefined ? ` · ${res.slip > 0 ? `${res.slip}d late` : res.slip < 0 ? `${Math.abs(res.slip)}d early` : 'on baseline'} vs baseline` : ''}`}
                        className="absolute top-1/2 h-[10px] -translate-y-1/2 overflow-hidden rounded-[1px]"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          background: 'var(--sw-rule-l)',
                          boxShadow: res.critical
                            ? '0 0 0 1.5px var(--sw-neg)'
                            : `inset 0 0 0 1px ${color}`,
                        }}
                      >
                        {/* Progress fill — solid portion = work complete */}
                        <div
                          className="h-full"
                          style={{ width: `${res.percent}%`, background: color }}
                        />
                      </div>
                    )}
                    {/* Baseline ghost — the approved dates, under the live bar */}
                    {res.baselineStart && res.baselineEnd && (
                      <div
                        className="absolute h-[3px] rounded-[1px]"
                        title={`Baseline ${formatDate(res.baselineStart)} → ${formatDate(res.baselineEnd)}`}
                        style={{
                          top: 'calc(50% + 9px)',
                          left: `${clamp(pct(parseISO(res.baselineStart).getTime()))}%`,
                          width: `${Math.max(
                            clamp(pct(parseISO(res.baselineEnd).getTime())) -
                              clamp(pct(parseISO(res.baselineStart).getTime())),
                            0.6,
                          )}%`,
                          background: 'var(--sw-rule)',
                        }}
                      />
                    )}
                  </div>
                )
              })}
              {todayInWindow && (
                <div
                  className="pointer-events-none absolute top-0 z-20 border-l border-dashed border-sw-neg"
                  style={{ left: `${clamp(pct(today.getTime()))}%`, height: rowsHeight }}
                >
                  <span className="absolute -top-0 left-1 text-[9px] font-bold uppercase text-sw-neg">
                    Today
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-sw-faint">
        {(
          [
            ['complete', 'Complete'],
            ['in-progress', 'In progress'],
            ['upcoming', 'Upcoming'],
            ['delayed', 'Delayed'],
          ] as Array<[MilestoneStatus, string]>
        ).map(([s, label]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block h-[8px] w-[14px] rounded-[1px]"
              style={{ background: statusColor(s) }}
            />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[8px] w-[14px] rounded-[1px]"
            style={{ boxShadow: 'inset 0 0 0 1.5px var(--sw-neg)' }}
          />
          Critical path
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-[4px] w-[14px]" style={{ background: 'var(--sw-ink)' }} />
          Summary
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[3px] w-[14px]"
            style={{ background: 'var(--sw-rule)' }}
          />
          Baseline
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block"
            style={{ width: 8, height: 8, background: 'var(--sw-dim)', transform: 'rotate(45deg)' }}
          />
          Milestone
        </span>
      </div>

      {msModal === 'new' && <MilestoneForm onClose={() => setMsModal(null)} />}
      {msModal !== null && msModal !== 'new' && (
        <MilestoneForm onClose={() => setMsModal(null)} initial={msModal.milestone} />
      )}
      {taskModal === 'new-task' && <TaskForm onClose={() => setTaskModal(null)} mode="task" />}
      {taskModal === 'new-group' && <TaskForm onClose={() => setTaskModal(null)} mode="group" />}
      {taskModal !== null && typeof taskModal === 'object' && (
        <TaskForm
          onClose={() => setTaskModal(null)}
          initial={taskModal.task}
          mode={tasks.some((x) => x.parentId === taskModal.task.id) ? 'group' : 'task'}
        />
      )}
    </div>
  )
}

/** Add/edit a programme task or group heading. */
function TaskForm({
  onClose,
  initial,
  mode,
}: {
  onClose: () => void
  initial?: ScheduleTask
  mode: 'task' | 'group'
}) {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const isGroup = mode === 'group'
  const todayISO = new Date().toISOString().slice(0, 10)
  const allTasks = project ? (state.scheduleTasks[project.id as string] ?? []) : []
  const others = allTasks.filter((t) => t.id !== initial?.id)
  // Predecessor candidates: leaf tasks only (summaries roll up).
  const leafOthers = others.filter((t) => !allTasks.some((x) => x.parentId === t.id))
  // A row can't be nested under itself or one of its own descendants.
  const descendants = new Set<string>()
  if (initial) {
    const stack = [initial.id as string]
    while (stack.length) {
      const id = stack.pop()!
      for (const c of allTasks.filter((x) => (x.parentId as string) === id)) {
        descendants.add(c.id as string)
        stack.push(c.id as string)
      }
    }
  }
  const parentCandidates = others.filter((t) => !descendants.has(t.id as string))

  const [form, setForm] = useState(() => ({
    ccId: (initial?.ccId ?? '') as string,
    parentId: (initial?.parentId ?? '') as string,
    name: initial?.name ?? '',
    start: initial?.start ?? todayISO,
    durationDays: initial ? durationWorkingDays(initial) : 5,
    status: initial?.status ?? ('upcoming' as MilestoneStatus),
    deps: (initial?.deps ?? []) as TaskDependency[],
    notes: initial?.notes ?? '',
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  if (!project) return null

  const nameMissing = isGroup && form.name.trim() === ''
  const durBad = !isGroup && (!form.durationDays || form.durationDays < 1)
  const selectedCode = project.codes.find((c) => (c.id as string) === form.ccId)
  const taskName = (id: string) => others.find((t) => (t.id as string) === id)?.name ?? id

  const addDep = () => {
    const free = leafOthers.find(
      (t) => !form.deps.some((d) => (d.id as string) === (t.id as string)),
    )
    if (!free) return
    setForm({ ...form, deps: [...form.deps, { id: free.id, type: 'FS', lag: 0 }] })
  }
  const patchDep = (i: number, patch: Partial<TaskDependency>) =>
    setForm({ ...form, deps: form.deps.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) })
  const removeDep = (i: number) =>
    setForm({ ...form, deps: form.deps.filter((_, idx) => idx !== i) })

  function save() {
    if (!project) return
    if (nameMissing || durBad) {
      setAttempted(true)
      return
    }
    const name = form.name.trim() || selectedCode?.desc || (isGroup ? 'New group' : 'Task')
    const parentId = form.parentId ? asId<ScheduleTaskId>(form.parentId) : undefined
    const common = {
      name,
      parentId,
      status: form.status,
      notes: form.notes.trim() || undefined,
    }
    const payload: Omit<ScheduleTask, 'id'> = isGroup
      ? { ...common, start: form.start, end: form.start }
      : {
          ...common,
          ccId: form.ccId ? (form.ccId as CostCodeId) : undefined,
          start: form.start,
          end: addWorkingDays(form.start, form.durationDays - 1),
          durationDays: form.durationDays,
          deps: form.deps.length ? form.deps : undefined,
        }
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_SCHEDULE_TASK',
        projectId: project.id,
        taskId: initial.id,
        patch: payload,
      })
    } else {
      dispatch({
        type: 'ADD_SCHEDULE_TASK',
        projectId: project.id,
        task: { id: asId<ScheduleTaskId>(newId('ST')), ...payload },
      })
    }
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? (isGroup ? 'Edit Group' : 'Edit Task') : isGroup ? 'Add Group' : 'Add Task'}
      widthClass="max-w-lg"
      footer={<Button onClick={save}>Save</Button>}
    >
      <Field
        label="Name"
        required={isGroup}
        error={attempted && nameMissing ? 'Required' : undefined}
      >
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          invalid={attempted && nameMissing}
          placeholder={isGroup ? 'e.g. Sub-structure' : (selectedCode?.desc ?? 'e.g. Framing')}
        />
      </Field>

      <Field label="Parent group" hint="Leave as top-level, or nest under a group.">
        <Select
          value={form.parentId}
          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
        >
          <option value="">— Top level —</option>
          {parentCandidates.map((t) => (
            <option key={t.id as string} value={t.id as string}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>

      {!isGroup && (
        <>
          <Field label="Cost code" hint="Optional — a task usually books to a code.">
            <CostCodeSelect
              projectId={project.id}
              codes={project.codes}
              value={form.ccId}
              onChange={(cc) => setForm({ ...form, ccId: cc })}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start" hint="Predecessors may push it.">
              <Input
                type="date"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </Field>
            <Field label="Duration (days)" error={attempted && durBad ? 'Min 1' : undefined}>
              <Input
                type="number"
                min={1}
                value={form.durationDays}
                onChange={(e) =>
                  setForm({ ...form, durationDays: Math.round(Number(e.target.value) || 0) })
                }
                invalid={attempted && durBad}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="in-progress">In Progress</option>
                <option value="complete">Complete</option>
                <option value="delayed">Delayed</option>
              </Select>
            </Field>
          </div>

          <div className="mt-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-sw-muted">Predecessors</span>
              <button
                type="button"
                onClick={addDep}
                disabled={leafOthers.length === 0 || form.deps.length >= leafOthers.length}
                className="cursor-pointer text-[11px] font-medium text-sw-violet hover:underline disabled:cursor-default disabled:text-sw-faint disabled:no-underline"
              >
                + Add predecessor
              </button>
            </div>
            {form.deps.length === 0 ? (
              <p className="text-[11px] text-sw-faint">
                No predecessors — this task starts on its own date.
              </p>
            ) : (
              <div className="space-y-2">
                {form.deps.map((d, i) => (
                  <div key={i} className="grid grid-cols-[1fr_64px_64px_24px] items-center gap-2">
                    <Select
                      aria-label={`Predecessor ${i + 1} task`}
                      value={d.id as string}
                      onChange={(e) => patchDep(i, { id: asId<ScheduleTaskId>(e.target.value) })}
                    >
                      {leafOthers.map((t) => (
                        <option key={t.id as string} value={t.id as string}>
                          {taskName(t.id as string)}
                        </option>
                      ))}
                    </Select>
                    <Select
                      aria-label={`Predecessor ${i + 1} type`}
                      value={d.type}
                      onChange={(e) => patchDep(i, { type: e.target.value as DependencyType })}
                    >
                      {DEP_TYPES.map((tp) => (
                        <option key={tp} value={tp}>
                          {tp}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      aria-label={`Predecessor ${i + 1} lag`}
                      value={d.lag}
                      onChange={(e) =>
                        patchDep(i, { lag: Math.round(Number(e.target.value) || 0) })
                      }
                      title="Lead/lag in working days"
                    />
                    <button
                      type="button"
                      onClick={() => removeDep(i)}
                      aria-label={`Remove predecessor ${i + 1}`}
                      className="text-[13px] text-sw-danger"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}

/** Legacy `S1` — Milestone Name / Target Date / Status / Notes. */
function MilestoneForm({ onClose, initial }: { onClose: () => void; initial?: Milestone }) {
  const project = useProject()
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    date: initial?.date ?? new Date().toISOString().slice(0, 10),
    status: initial?.status ?? ('upcoming' as MilestoneStatus),
    notes: initial?.notes ?? '',
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  if (!project) return null

  function save() {
    if (!project) return
    if (!form.name.trim()) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_MILESTONE',
        projectId: project.id,
        milestoneId: initial.id,
        patch: form,
      })
    } else {
      dispatch({
        type: 'ADD_MILESTONE',
        projectId: project.id,
        milestone: { id: asId<MilestoneId>(newId('MS')), ...form },
      })
    }
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? 'Edit Milestone' : 'Add Milestone'}
      footer={<Button onClick={save}>Save Milestone</Button>}
    >
      <Field
        label="Milestone Name"
        required
        error={attempted && !form.name.trim() ? 'Required' : undefined}
      >
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          invalid={attempted && !form.name.trim()}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}
          >
            <option value="upcoming">Upcoming</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}
