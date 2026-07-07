import { useState } from 'react'
import { Button, Dialog, EmptyState, Field, Input, Select } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { ProjectId, Rfi, RfiId, RfiStatus } from '@/types'
import { newId } from '@/lib/newId'

const STATUSES: RfiStatus[] = ['Open', 'Closed', 'Overdue']

interface FormProps {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  initial?: Rfi
}

function RfiForm({ open, onClose, projectId, initial }: FormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Rfi, 'id'>>(() =>
    initial
      ? { ...initial }
      : {
          rfiNo: 0, // reducer will fill it
          subject: '',
          addressee: '',
          dateIssued: new Date().toISOString().slice(0, 10),
          dateRequired: '',
          dateResponded: null,
          response: '',
          status: 'Open',
        },
  )
  const [attempted, setAttempted] = useState(false)
  const subjMissing = form.subject.trim() === ''
  const isEdit = !!initial

  function save() {
    if (subjMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_RFI', projectId, rfiId: initial.id, patch: form })
    } else {
      const id = asId<RfiId>(newId('RFI'))
      dispatch({ type: 'ADD_RFI', projectId, rfi: { id, ...form } })
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit RFI #${initial?.rfiNo}` : 'New RFI'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <Field label="Subject" required error={attempted && subjMissing ? 'Required' : undefined}>
        <Input
          autoFocus
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          invalid={attempted && subjMissing}
        />
      </Field>
      <Field label="Addressee">
        <Input
          value={form.addressee}
          onChange={(e) => setForm({ ...form, addressee: e.target.value })}
          placeholder="e.g. Project Architect"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Issued">
          <Input
            type="date"
            value={form.dateIssued}
            onChange={(e) => setForm({ ...form, dateIssued: e.target.value })}
          />
        </Field>
        <Field label="Required by">
          <Input
            type="date"
            value={form.dateRequired}
            onChange={(e) => setForm({ ...form, dateRequired: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as RfiStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Response">
        <Input
          value={form.response}
          onChange={(e) => setForm({ ...form, response: e.target.value })}
          placeholder="e.g. DD-107 Rev C"
        />
      </Field>
    </Dialog>
  )
}

export function RfisTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState<Rfi | null>(null)
  const [creating, setCreating] = useState(false)

  if (!project) return null
  const rfis = state.rfis[project.id as string] ?? []
  const openCount = rfis.filter((r) => r.status === 'Open' || r.status === 'Overdue').length

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">RFI Register</h2>
          <p className="text-xs text-sw-muted">
            {openCount} open · {rfis.length - openCount} closed
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New RFI</Button>
      </header>

      {rfis.length === 0 ? (
        <EmptyState
          title="No RFIs yet"
          description="Raise RFIs to track clarifications from the design team."
          action={<Button onClick={() => setCreating(true)}>+ New RFI</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Addressee</th>
                <th>Issued</th>
                <th>Required</th>
                <th>Response</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rfis.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setEditing(r)}
                  className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                >
                  <td className="font-mono font-medium">#{r.rfiNo}</td>
                  <td>{r.subject}</td>
                  <td className="text-sw-muted">{r.addressee}</td>
                  <td className="text-sw-muted">{formatDate(r.dateIssued)}</td>
                  <td className="text-sw-muted">{formatDate(r.dateRequired)}</td>
                  <td className="text-sw-muted">{r.response || '—'}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RfiForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
      {editing && (
        <RfiForm open onClose={() => setEditing(null)} projectId={project.id} initial={editing} />
      )}
    </div>
  )
}
