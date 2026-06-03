import { useMemo, useState } from 'react'
import { Button, Card, Dialog, EmptyState, Field, Input } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { CostCodeId, ProjectId, Timesheet, TimesheetId } from '@/types'

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
    const id = asId<TimesheetId>(`TS-${Date.now()}`)
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
          <select
            value={form.ccId as string}
            onChange={(e) => setForm({ ...form, ccId: e.target.value as CostCodeId })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            {codes.map((c) => (
              <option key={c.id} value={c.id as string}>
                {c.code} · {c.desc}
              </option>
            ))}
          </select>
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
          <h2 className="text-lg font-semibold">Timesheets</h2>
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
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-sw-muted text-left border-b border-sw-border">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Worker</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium text-right">Hours</th>
                <th className="px-3 py-2 font-medium text-right">Rate</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {timesheets.map((t) => (
                <tr key={t.id} className="border-b border-sw-border last:border-0">
                  <td className="px-3 py-2 text-sw-muted">{formatDate(t.date)}</td>
                  <td className="px-3 py-2">{t.worker}</td>
                  <td className="px-3 py-2 text-sw-muted">{t.role}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{t.hours}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(t.rate)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium">
                    {formatCurrency(t.hours * t.rate)}
                  </td>
                  <td className="px-3 py-2 text-right">
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
        </Card>
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
