import { useMemo, useState } from 'react'
import { Button, Dialog, Field, Input, Select, useConfirm, useToast } from '@/components/ui'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { CostCodeSelect } from '../CostCodeSelect'
import { asId } from '@/types'
import type {
  CostCodeId,
  Milestone,
  MilestoneId,
  MilestoneStatus,
  ScheduleTask,
  ScheduleTaskId,
} from '@/types'
import { newId } from '@/lib/newId'

const DAY_MS = 86_400_000
const LOOKAHEAD_DAYS = 42

/** Parse an ISO yyyy-mm-dd as local midnight (avoids UTC drift). */
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
 * Program of Works — the cost-code Gantt (Phase 4.7-O, bucket C, Direction A).
 *
 * Rows are BOQ cost codes placed on a timeline via `ScheduleTask` records, so
 * the programme is deliberate: a code appears once it's been given dates.
 * Tasks group into phase bands; milestones ride above as diamonds; a today
 * marker tracks the current date when it falls inside the window. The
 * "lookahead" toggle is the second view (next six weeks).
 *
 * Ships dependency-free — `ScheduleTask.deps` is reserved for the later
 * critical-path pass.
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

  // ── Window ────────────────────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const win = useMemo(() => {
    if (view === 'lookahead') {
      return { start: today.getTime(), end: today.getTime() + LOOKAHEAD_DAYS * DAY_MS }
    }
    const stamps: number[] = []
    for (const t of tasks) stamps.push(parseISO(t.start).getTime(), parseISO(t.end).getTime())
    for (const m of milestones) stamps.push(parseISO(m.date).getTime())
    if (stamps.length === 0) return null
    return { start: Math.min(...stamps) - 3 * DAY_MS, end: Math.max(...stamps) + 3 * DAY_MS }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, milestones, view])

  if (!project) return null

  const span = win ? win.end - win.start : 1
  const pct = (ms: number) => ((ms - (win?.start ?? 0)) / span) * 100
  const clamp = (n: number) => Math.max(0, Math.min(100, n))

  // Tasks/milestones visible in the current window.
  const shownTasks = win
    ? tasks.filter(
        (t) => parseISO(t.end).getTime() >= win.start && parseISO(t.start).getTime() <= win.end,
      )
    : []
  const shownMilestones = win
    ? milestones.filter((m) => {
        const d = parseISO(m.date).getTime()
        return d >= win.start && d <= win.end
      })
    : []

  // Phase bands, in first-appearance order.
  const phases: string[] = []
  for (const t of shownTasks) {
    const p = t.phase?.trim() || 'Unphased'
    if (!phases.includes(p)) phases.push(p)
  }

  // Month ticks across the window.
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
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
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
                  const s = parseISO(t.start).getTime()
                  const e = parseISO(t.end).getTime()
                  const left = clamp(pct(s))
                  const width = Math.max(clamp(pct(e)) - left, 0.8)
                  const days = Math.max(Math.round((e - s) / DAY_MS) + 1, 1)
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
                          <span className="text-[10px] text-sw-faint">{days}d</span>
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
                          title={`${formatDate(t.start)} → ${formatDate(t.end)}`}
                          className="absolute top-1/2 h-[10px] -translate-y-1/2 rounded-[1px]"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: statusColor(t.status),
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
            className="inline-block"
            style={{
              width: 8,
              height: 8,
              background: 'var(--sw-dim)',
              transform: 'rotate(45deg)',
            }}
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

/** Add/edit a programme task — places a cost code on the timeline. */
function TaskForm({ onClose, initial }: { onClose: () => void; initial?: ScheduleTask }) {
  const project = useProject()
  const dispatch = useDispatch()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState(() => ({
    ccId: (initial?.ccId ?? project?.codes[0]?.id ?? '') as string,
    name: initial?.name ?? '',
    start: initial?.start ?? today,
    end: initial?.end ?? today,
    status: initial?.status ?? ('upcoming' as MilestoneStatus),
    phase: initial?.phase ?? '',
    notes: initial?.notes ?? '',
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  if (!project) return null

  const codeMissing = !form.ccId
  const datesBad = !!form.start && !!form.end && form.end < form.start
  const selectedCode = project.codes.find((c) => (c.id as string) === form.ccId)

  function save() {
    if (!project) return
    if (codeMissing || datesBad) {
      setAttempted(true)
      return
    }
    // Blank name falls back to the cost code's description.
    const name = form.name.trim() || selectedCode?.desc || 'Task'
    const payload = {
      ccId: form.ccId as CostCodeId,
      name,
      start: form.start,
      end: form.end,
      status: form.status,
      phase: form.phase.trim() || undefined,
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
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start">
          <Input
            type="date"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          />
        </Field>
        <Field label="Finish" error={attempted && datesBad ? 'Finish is before start' : undefined}>
          <Input
            type="date"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
            invalid={attempted && datesBad}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
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
        <Field label="Phase" hint="Groups rows, e.g. Lockup.">
          <Input
            value={form.phase}
            onChange={(e) => setForm({ ...form, phase: e.target.value })}
            placeholder="e.g. Frame"
          />
        </Field>
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
