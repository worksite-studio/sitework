import { useState } from 'react'
import { Button, Card, Dialog, EmptyState, Field, Input } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { Milestone, MilestoneId, MilestoneStatus, ProjectId } from '@/types'

const STATUSES: MilestoneStatus[] = ['upcoming', 'in-progress', 'complete', 'delayed']

interface FormProps {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  initial?: Milestone
}

function MilestoneForm({ open, onClose, projectId, initial }: FormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Milestone, 'id'>>(() =>
    initial
      ? { ...initial }
      : {
          name: '',
          date: new Date().toISOString().slice(0, 10),
          status: 'upcoming',
          notes: '',
        },
  )
  const [attempted, setAttempted] = useState(false)
  const nameMissing = form.name.trim() === ''
  const isEdit = !!initial

  function save() {
    if (nameMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_MILESTONE', projectId, milestoneId: initial.id, patch: form })
    } else {
      const id = asId<MilestoneId>(`MS-${Date.now()}`)
      dispatch({ type: 'ADD_MILESTONE', projectId, milestone: { id, ...form } })
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${initial?.name}` : 'New milestone'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <Field label="Name" required error={attempted && nameMissing ? 'Required' : undefined}>
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          invalid={attempted && nameMissing}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as MilestoneStatus })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}

/**
 * Schedule / Milestones tab. Read+add for the project schedule with status
 * column. Calendar tab (Phase 1.5-D) consumes the same milestones via
 * state.milestones[projectId].
 */
export function MilestonesTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [creating, setCreating] = useState(false)

  if (!project) return null
  const milestones = state.milestones[project.id as string] ?? []
  const complete = milestones.filter((m) => m.status === 'complete').length

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Schedule</h2>
          <p className="text-xs text-sw-muted">
            {complete} / {milestones.length} complete
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Milestone</Button>
      </header>

      {milestones.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Track delivery dates and dependencies as the project moves forward."
          action={<Button onClick={() => setCreating(true)}>+ New Milestone</Button>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-sw-muted text-left border-b border-sw-border">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setEditing(m)}
                  className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                >
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 text-sw-muted">{formatDate(m.date)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-3 py-2 text-sw-muted">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <MilestoneForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
      {editing && (
        <MilestoneForm
          open
          onClose={() => setEditing(null)}
          projectId={project.id}
          initial={editing}
        />
      )}
    </div>
  )
}
