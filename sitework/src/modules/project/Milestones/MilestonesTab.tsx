import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { Milestone, MilestoneId, MilestoneStatus } from '@/types'
import { newId } from '@/lib/newId'

/**
 * Schedule — transliteration of legacy `_1` + `S1` (R7, PARITY gap-12 row):
 * "N/M milestones complete" sub-line, 2px green-gradient progress bar,
 * dotted timeline (filled green complete / dashed accent in-progress /
 * hollow upcoming), name + bare status + date + notes + tiny Edit link per
 * node, "+ Milestone" and the Add/Edit Milestone modal (name / target date /
 * status / notes, "Save Milestone").
 */
export function MilestonesTab() {
  const project = useProject()
  const state = useAppState()
  const [modal, setModal] = useState<'new' | { milestone: Milestone } | null>(null)
  if (!project) return null

  const milestones: Milestone[] = state.milestones[project.id as string] ?? []
  const complete = milestones.filter((m) => m.status === 'complete').length
  const pct = milestones.length > 0 ? Math.round((complete / milestones.length) * 100) : 0

  function dot(status: MilestoneStatus): { color: string; kind: 'full' | 'half' | 'empty' } {
    if (status === 'complete') return { color: 'var(--sw-pos)', kind: 'full' }
    if (status === 'in-progress') return { color: 'var(--sw-ink)', kind: 'half' }
    return { color: 'var(--sw-faint)', kind: 'empty' }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Schedule</h2>
          <div className="text-[13px] text-sw-dim">
            {complete}/{milestones.length} milestones complete
          </div>
        </div>
        <Button onClick={() => setModal('new')}>+ Milestone</Button>
      </header>

      {/* Legacy _1 progress bar: 2px, green gradient. */}
      <div className="mb-7 h-[2px] overflow-hidden bg-sw-rule-l">
        <div
          className="h-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg,#059669 0%,#34D399 100%)',
            transition: 'width 0.4s',
          }}
        />
      </div>

      <div className="flex flex-col">
        {milestones.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-sw-faint">No milestones added yet.</div>
        ) : (
          milestones.map((m, i) => {
            const d = dot(m.status)
            return (
              <div
                key={m.id as string}
                className="flex gap-4"
                style={{ paddingBottom: i < milestones.length - 1 ? 20 : 0 }}
              >
                <div className="flex w-5 shrink-0 flex-col items-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="mt-1 shrink-0">
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      fill={d.kind === 'empty' ? 'none' : d.color}
                      stroke={d.color}
                      strokeWidth="1.5"
                      strokeDasharray={d.kind === 'half' ? '12.5 12.5' : undefined}
                    />
                  </svg>
                  {i < milestones.length - 1 && <div className="mt-1 w-[2px] flex-1 bg-white" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="mb-[2px] flex items-center gap-2.5">
                    <span
                      className="text-[13px] font-bold"
                      style={{
                        color: m.status === 'upcoming' ? 'var(--sw-dim)' : 'var(--sw-ink)',
                      }}
                    >
                      {m.name}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div
                    className="text-[12px] text-sw-faint"
                    style={{ marginBottom: m.notes ? 4 : 0 }}
                  >
                    {formatDate(m.date)}
                  </div>
                  {m.notes && <div className="text-[12px] text-sw-dim">{m.notes}</div>}
                  <button
                    type="button"
                    onClick={() => setModal({ milestone: m })}
                    className="mt-1 cursor-pointer bg-transparent p-0 text-[10px] text-sw-ink hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {modal === 'new' && <MilestoneForm onClose={() => setModal(null)} />}
      {modal !== null && modal !== 'new' && (
        <MilestoneForm onClose={() => setModal(null)} initial={modal.milestone} />
      )}
    </div>
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
