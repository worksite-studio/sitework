import { useMemo, useState } from 'react'
import { Button, Dialog, EmptyState, Field, Input, Select } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { CostCodeId, ProjectId, Timesheet, TimesheetId } from '@/types'
import { newId } from '@/lib/newId'

interface FormProps {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  codes: Array<{ id: CostCodeId; code: string; desc: string }>
}

function TimesheetForm({ open, onClose, projectId, codes }: FormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Timesheet, 'id'>>({
    date: new Date().toISOString().slice(0, 10),
    worker: '',
    role: '',
    ccId: (codes[0]?.id ?? ('' as unknown as CostCodeId)) as CostCodeId,
    hours: 0,
    rate: 0,
    notes: '',
  })
  const [attempted, setAttempted] = useState(false)
  const workerMissing = form.worker.trim() === ''

  function save() {
    if (workerMissing) {
      setAttempted(true)
      return
    }
    const id = asId<TimesheetId>(newId('TS'))
    dispatch({ type: 'ADD_TIMESHEET', projectId, timesheet: { id, ...form } })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New timesheet"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Worker" required error={attempted && workerMissing ? 'Required' : undefined}>
          <Input
            value={form.worker}
            onChange={(e) => setForm({ ...form, worker: e.target.value })}
            invalid={attempted && workerMissing}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Role">
          <Input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Carpenter"
          />
        </Field>
        <Field label="Cost code">
          <Select
            value={form.ccId as string}
            onChange={(e) => setForm({ ...form, ccId: e.target.value as CostCodeId })}
          >
            {codes.map((c) => (
              <option key={c.id} value={c.id as string}>
                {c.code} · {c.desc}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Hours">
          <Input
            type="number"
            min={0}
            step="0.25"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Rate ($/hr)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
    </Dialog>
  )
}

export function TimesheetsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [creating, setCreating] = useState(false)

  const codes = useMemo(
    () => (project ? project.codes.map((c) => ({ id: c.id, code: c.code, desc: c.desc })) : []),
    [project],
  )

  if (!project) return null
  const timesheets = state.timesheets[project.id as string] ?? []
  const total = timesheets.reduce((s, t) => s + (t.hours || 0) * (t.rate || 0), 0)

  function del(ts: Timesheet) {
    if (!project) return
    const ok = window.confirm(`Delete timesheet for ${ts.worker} on ${ts.date}?`)
    if (!ok) return
    dispatch({ type: 'DELETE_TIMESHEET', projectId: project.id, timesheetId: ts.id })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Timesheets</h2>
          <p className="text-xs text-sw-muted">
            Total: <span className="text-sw-text font-medium">{formatCurrency(total)}</span>
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={codes.length === 0}>
          + New Entry
        </Button>
      </header>

      {timesheets.length === 0 ? (
        <EmptyState
          title="No timesheets yet"
          description="Record hours against cost codes to track in-house labour cost."
          action={
            <Button onClick={() => setCreating(true)} disabled={codes.length === 0}>
              + New Entry
            </Button>
          }
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Worker</th>
                <th>Role</th>
                <th className="text-right">Hours</th>
                <th className="text-right">Rate</th>
                <th className="text-right">Total</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {timesheets.map((t) => (
                <tr key={t.id} className="border-b border-sw-border last:border-0">
                  <td className="text-sw-muted">{formatDate(t.date)}</td>
                  <td>{t.worker}</td>
                  <td className="text-sw-muted">{t.role}</td>
                  <td className="text-right font-mono">{t.hours}</td>
                  <td className="text-right font-mono">{formatCurrency(t.rate)}</td>
                  <td className="text-right font-mono font-medium">
                    {formatCurrency(t.hours * t.rate)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => del(t)}
                      aria-label={`Delete timesheet for ${t.worker}`}
                      className="text-sw-muted hover:text-sw-danger transition px-2"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TimesheetForm
        open={creating}
        onClose={() => setCreating(false)}
        projectId={project.id}
        codes={codes}
      />
    </div>
  )
}
