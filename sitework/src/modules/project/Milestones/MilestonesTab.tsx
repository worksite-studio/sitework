import { useMemo, useState } from 'react'
import { Button, Dialog, Field, Input, Select, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { addWorkingDays, computeSchedule, durationWorkingDays } from '@/lib/schedule'
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

function parseISO(s: string): Date {
  return new Date(`${s}T00:00:00`)
}

/** Bar / diamond colour per status — matches the legacy milestone dots. */
function statusColor(status: MilestoneStatus): string {
  if (status === 'complete') return 'var(--sw-pos)'
  if (status === 'in-progress') return 'var(--sw-ink)'
  if (status === 'delayed') return 'var(--sw-neg)'
  return 'var(--sw-faint)'
}

/**
 * Program of Works — the cost-code Gantt with a critical-path engine
 * (Phase 4.7-O rows; 4.7-P scheduling engine).
 *
 * Rows are BOQ cost codes placed on a timeline via `ScheduleTask` records. The
 * pure engine (`@/lib/schedule`) resolves typed dependencies (FS/SS/FF/SF +
 * lag) over a working-day calendar, so a task's bar is positioned by its
 * COMPUTED dates — shift a predecessor and its successors cascade. Critical-
 * path tasks (zero float) are ringed; each row shows its slack. A dependency
 * cycle is caught and surfaced rather than mis-drawn.
 *
 * Dependency arrows + the editable split-grid land in the next tier (4.7-Q).
 */
export function MilestonesTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const { toast } = useToast()
  const [msModal, setMsModal] = useState<'new' | { milestone: Milestone } | null>(null)
  const [taskModal, setTaskModal] = useState<'new' | { task: ScheduleTask } | null>(null)
  const [view, setView] = useState<'full' | 'lookahead'>('full')

  const pid = project?.id as string | undefined
  const tasks: ScheduleTask[] = useMemo(
    () => (pid ? (state.scheduleTasks[pid] ?? []) : []),
    [state.scheduleTasks, pid],
  )
  const milestones: Milestone[] = useMemo(
    () => (pid ? (state.milestones[pid] ?? []) : []),
    [state.milestones, pid],
  )

  // Run the scheduling engine — computed dates drive the chart.
  const sched = useMemo(() => computeSchedule(tasks), [tasks])
  const startOf = (t: ScheduleTask) => sched.tasks.get(t.id as string)?.start ?? t.start
  const endOf = (t: ScheduleTask) => sched.tasks.get(t.id as string)?.end ?? t.end

  // ── Window (uses computed dates) ────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const win = useMemo(() => {
    if (view === 'lookahead') {
      return { start: today.getTime(), end: today.getTime() + LOOKAHEAD_DAYS * DAY_MS }
    }
    const stamps: number[] = []
    for (const t of tasks) {
      stamps.push(parseISO(startOf(t)).getTime(), parseISO(endOf(t)).getTime())
    }
    for (const m of milestones) stamps.push(parseISO(m.date).getTime())
    if (stamps.length === 0) return null
    return { start: Math.min(...stamps) - 3 * DAY_MS, end: Math.max(...stamps) + 3 * DAY_MS }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, milestones, view, sched])

  if (!project) return null

  const span = win ? win.end - win.start : 1
  const pct = (ms: number) => ((ms - (win?.start ?? 0)) / span) * 100
  const clamp = (n: number) => Math.max(0, Math.min(100, n))

  const shownTasks = win
    ? tasks.filter(
        (t) =>
          parseISO(endOf(t)).getTime() >= win.start && parseISO(startOf(t)).getTime() <= win.end,
      )
    : []
  const shownMilestones = win
    ? milestones.filter((m) => {
        const d = parseISO(m.date).getTime()
        return d >= win.start && d <= win.end
      })
    : []

  const phases: string[] = []
  for (const t of shownTasks) {
    const p = t.phase?.trim() || 'Unphased'
    if (!phases.includes(p)) phases.push(p)
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
  const complete = tasks.filter((t) => t.status === 'complete').length
  const criticalCount = [...sched.tasks.values()].filter((s) => s.critical).length

  async function deleteTask(t: ScheduleTask) {
    if (!project) return
    const ok = await confirm({
      title: 'Remove from programme',
      message: `Remove "${t.name}" from the programme? The cost code itself is untouched.`,
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'DELETE_SCHEDULE_TASK', projectId: project.id, taskId: t.id })
    toast('Task removed from programme', 'success')
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Program of Works
          </h2>
          <div className="text-[13px] text-sw-dim">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {complete} complete ·{' '}
            {criticalCount} on critical path · {milestones.length} milestone
            {milestones.length !== 1 ? 's' : ''}
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
          <Button variant="secondary" onClick={() => setMsModal('new')}>
            + Milestone
          </Button>
          <Button onClick={() => setTaskModal('new')} disabled={project.codes.length === 0}>
            + Task
          </Button>
        </div>
      </header>

      {sched.cycle.length > 0 && (
        <div className="mb-4 rounded-[1px] border border-sw-neg bg-sw-neg-bg px-4 py-2.5 text-[12px] text-sw-neg">
          A dependency loop was found between {sched.cycle.length} tasks — the programme can't be
          scheduled until it's broken. Bars fall back to their saved dates and the critical path is
          paused.
        </div>
      )}

      {!win || shownTasks.length + shownMilestones.length === 0 ? (
        <div className="border-y border-sw-rule py-14 text-center text-[13px] text-sw-faint">
          {tasks.length === 0 && milestones.length === 0
            ? 'No programme yet — add a task to place a cost code on the timeline.'
            : view === 'lookahead'
              ? 'No programme activity in the next six weeks.'
              : 'Nothing to show in this window.'}
        </div>
      ) : (
        <div className="border-t border-sw-ink">
          {/* Month axis */}
          <div className="flex border-b border-sw-rule">
            <div className="w-[240px] shrink-0 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
              Task
            </div>
            <div className="relative flex-1 py-2">
              {ticks.map((t) => (
                <span
                  key={t.label + t.left}
                  className="absolute top-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-sw-faint"
                  style={{ left: `${clamp(t.left)}%` }}
                >
                  {t.label}
                </span>
              ))}
              <div className="h-3" />
            </div>
          </div>

          {/* Milestone diamonds */}
          {shownMilestones.length > 0 && (
            <div className="flex items-center border-b border-sw-rule-l">
              <div className="w-[240px] shrink-0 py-2.5 pr-4 text-[11px] font-semibold text-sw-dim">
                Milestones
              </div>
              <div className="relative h-9 flex-1">
                {shownMilestones.map((m) => (
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
            </div>
          )}

          {/* Phase bands + task bars */}
          {phases.map((phase) => (
            <div key={phase}>
              <div className="flex bg-sw-bg">
                <div className="w-[240px] shrink-0 py-1.5 pr-4 text-[9px] font-bold uppercase tracking-[0.1em] text-sw-dim">
                  {phase}
                </div>
                <div className="flex-1" />
              </div>
              {shownTasks
                .filter((t) => (t.phase?.trim() || 'Unphased') === phase)
                .map((t) => {
                  const code = project.codes.find((c) => c.id === t.ccId)
                  const st = sched.tasks.get(t.id as string)
                  const s = parseISO(startOf(t)).getTime()
                  const e = parseISO(endOf(t)).getTime()
                  const left = clamp(pct(s))
                  const width = Math.max(clamp(pct(e)) - left, 0.8)
                  const dur = st?.duration ?? durationWorkingDays(t)
                  const critical = st?.critical ?? false
                  const float = st?.totalFloat ?? 0
                  return (
                    <div
                      key={t.id as string}
                      className="group flex items-center border-b border-sw-rule-l hover:bg-sw-muted/5"
                    >
                      <div className="w-[240px] shrink-0 py-2.5 pr-4">
                        <button
                          type="button"
                          onClick={() => setTaskModal({ task: t })}
                          className="block cursor-pointer text-left text-[12px] font-semibold text-sw-ink hover:underline"
                        >
                          {t.name}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-sw-faint">
                            {code ? code.code : '—'}
                          </span>
                          <span className="text-[10px] text-sw-faint">{dur}d</span>
                          <span
                            className="text-[10px]"
                            style={{ color: critical ? 'var(--sw-neg)' : 'var(--sw-faint)' }}
                          >
                            {critical ? 'critical' : `${float}d float`}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteTask(t)}
                            aria-label={`Remove ${t.name}`}
                            className="text-[11px] text-sw-danger opacity-0 transition group-hover:opacity-100"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="relative h-9 flex-1">
                        <div
                          title={`${formatDate(startOf(t))} → ${formatDate(endOf(t))}${critical ? ' · critical path' : ` · ${float}d float`}`}
                          className="absolute top-1/2 h-[10px] -translate-y-1/2 rounded-[1px]"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: statusColor(t.status),
                            boxShadow: critical ? '0 0 0 1.5px var(--sw-neg)' : undefined,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          ))}

          {/* Today marker */}
          {todayInWindow && (
            <div className="flex">
              <div className="w-[240px] shrink-0" />
              <div className="relative h-5 flex-1">
                <span
                  className="absolute top-0 text-[9px] font-bold uppercase tracking-[0.08em] text-sw-neg"
                  style={{ left: `${clamp(pct(today.getTime()))}%`, transform: 'translateX(-50%)' }}
                >
                  Today
                </span>
              </div>
            </div>
          )}
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
      {taskModal === 'new' && <TaskForm onClose={() => setTaskModal(null)} />}
      {taskModal !== null && taskModal !== 'new' && (
        <TaskForm onClose={() => setTaskModal(null)} initial={taskModal.task} />
      )}
    </div>
  )
}

/** Add/edit a programme task — cost code, duration, status, and predecessors. */
function TaskForm({ onClose, initial }: { onClose: () => void; initial?: ScheduleTask }) {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const today = new Date().toISOString().slice(0, 10)
  const allTasks = project ? (state.scheduleTasks[project.id as string] ?? []) : []
  const others = allTasks.filter((t) => t.id !== initial?.id)

  const [form, setForm] = useState(() => ({
    ccId: (initial?.ccId ?? project?.codes[0]?.id ?? '') as string,
    name: initial?.name ?? '',
    start: initial?.start ?? today,
    durationDays: initial ? durationWorkingDays(initial) : 5,
    status: initial?.status ?? ('upcoming' as MilestoneStatus),
    phase: initial?.phase ?? '',
    deps: (initial?.deps ?? []) as TaskDependency[],
    notes: initial?.notes ?? '',
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  if (!project) return null

  const codeMissing = !form.ccId
  const durBad = !form.durationDays || form.durationDays < 1
  const selectedCode = project.codes.find((c) => (c.id as string) === form.ccId)

  const taskName = (id: string) => others.find((t) => (t.id as string) === id)?.name ?? id
  const addDep = () => {
    const firstFree = others.find(
      (t) => !form.deps.some((d) => (d.id as string) === (t.id as string)),
    )
    if (!firstFree) return
    setForm({
      ...form,
      deps: [...form.deps, { id: firstFree.id, type: 'FS', lag: 0 }],
    })
  }
  const patchDep = (i: number, patch: Partial<TaskDependency>) =>
    setForm({ ...form, deps: form.deps.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) })
  const removeDep = (i: number) =>
    setForm({ ...form, deps: form.deps.filter((_, idx) => idx !== i) })

  function save() {
    if (!project) return
    if (codeMissing || durBad) {
      setAttempted(true)
      return
    }
    const name = form.name.trim() || selectedCode?.desc || 'Task'
    const end = addWorkingDays(form.start, form.durationDays - 1)
    const payload = {
      ccId: form.ccId as CostCodeId,
      name,
      start: form.start,
      end,
      durationDays: form.durationDays,
      status: form.status,
      phase: form.phase.trim() || undefined,
      deps: form.deps.length ? form.deps : undefined,
      notes: form.notes.trim() || undefined,
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
      title={isEdit ? 'Edit Task' : 'Add Task'}
      widthClass="max-w-lg"
      footer={<Button onClick={save}>Save Task</Button>}
    >
      <Field label="Cost code" required error={attempted && codeMissing ? 'Required' : undefined}>
        <CostCodeSelect
          projectId={project.id}
          codes={project.codes}
          value={form.ccId}
          onChange={(cc) => setForm({ ...form, ccId: cc })}
          invalid={attempted && codeMissing}
        />
      </Field>
      <Field label="Task name" hint="Leave blank to use the cost code's description.">
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={selectedCode?.desc ?? 'e.g. Framing — carpentry'}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Start" hint="Earliest — predecessors may push it.">
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
      <Field label="Phase" hint="Groups rows, e.g. Lockup.">
        <Input
          value={form.phase}
          onChange={(e) => setForm({ ...form, phase: e.target.value })}
          placeholder="e.g. Frame"
        />
      </Field>

      {/* Predecessors */}
      <div className="mt-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-sw-muted">Predecessors</span>
          <button
            type="button"
            onClick={addDep}
            disabled={others.length === 0 || form.deps.length >= others.length}
            className="cursor-pointer text-[11px] font-medium text-sw-violet hover:underline disabled:cursor-default disabled:text-sw-faint disabled:no-underline"
          >
            + Add predecessor
          </button>
        </div>
        {others.length === 0 ? (
          <p className="text-[11px] text-sw-faint">Add more tasks to link predecessors.</p>
        ) : form.deps.length === 0 ? (
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
                  {others.map((t) => (
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
                  onChange={(e) => patchDep(i, { lag: Math.round(Number(e.target.value) || 0) })}
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
            <p className="text-[10px] text-sw-faint">
              Type: FS finish→start · SS start→start · FF finish→finish · SF start→finish. Lag is in
              working days (negative = lead).
            </p>
          </div>
        )}
      </div>

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
