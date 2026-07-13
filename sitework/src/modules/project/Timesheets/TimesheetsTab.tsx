import { useState } from 'react'
import { useAppState, useDispatch } from '@/state/context'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { newId } from '@/lib/newId'
import { asId } from '@/types'
import type { CostCodeId, Timesheet, TimesheetId } from '@/types'

/**
 * Timesheets — transliteration of legacy `U1` + `C1` (R7, PARITY gap-12
 * row): "Nh logged · $X labour cost" sub-line, columns Date / Worker /
 * Role / Cost Code ("012 — desc") / Hours ("8h") / Rate ("$95/hr") /
 * Total / × delete, rows sorted newest-first, "+ Log Time" modal.
 */
export function TimesheetsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [logging, setLogging] = useState(false)
  if (!project) return null

  const entries: Timesheet[] = state.timesheets[project.id as string] ?? []
  const hoursTotal = entries.reduce((s, t) => s + (t.hours || 0), 0)
  const labourCost = entries.reduce((s, t) => s + (t.hours || 0) * (t.rate || 0), 0)
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  function codeText(ccId: CostCodeId): string {
    const cc = project?.codes.find((c) => c.id === ccId)
    return cc ? `${cc.code} — ${cc.desc}` : '—'
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Timesheets</h2>
          <div className="text-[13px] text-sw-dim">
            {hoursTotal.toFixed(0)}h logged · {formatCurrency(labourCost)} labour cost
          </div>
        </div>
        <Button onClick={() => setLogging(true)}>+ Log Time</Button>
      </header>

      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Worker</th>
              <th>Role</th>
              <th>Cost Code</th>
              <th className="text-right">Hours</th>
              <th className="text-right">Rate</th>
              <th className="text-right">Total</th>
              <th aria-label="Delete" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-[13px] text-sw-faint">
                  No timesheet entries yet.
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <tr key={t.id as string} className="border-b border-sw-rule-l">
                  <td className="text-sw-dim">{formatDate(t.date)}</td>
                  <td className="font-semibold">{t.worker}</td>
                  <td className="text-sw-dim">{t.role}</td>
                  <td className="text-sw-dim">{codeText(t.ccId)}</td>
                  <td className="text-right font-mono">{t.hours}h</td>
                  <td className="text-right font-mono text-sw-dim">${t.rate}/hr</td>
                  <td className="text-right font-mono font-semibold">
                    {formatCurrency(t.hours * t.rate)}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({
                          type: 'DELETE_TIMESHEET',
                          projectId: project.id,
                          timesheetId: t.id,
                        })
                      }
                      aria-label={`Delete entry ${t.id}`}
                      className="cursor-pointer bg-transparent text-[11px] text-sw-faint hover:text-sw-danger"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {logging && <TimesheetForm onClose={() => setLogging(false)} />}
    </div>
  )
}

/** Legacy `C1` — Log Time modal: worker + hours required. */
function TimesheetForm({ onClose }: { onClose: () => void }) {
  const project = useProject()
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    worker: '',
    role: '',
    ccId: (project?.codes[0]?.id as string) ?? '',
    hours: '',
    rate: '',
    notes: '',
  })
  const [attempted, setAttempted] = useState(false)
  if (!project) return null

  function save() {
    if (!project) return
    if (!form.worker.trim() || !form.hours) {
      setAttempted(true)
      return
    }
    const timesheet: Timesheet = {
      id: asId<TimesheetId>(newId('TS')),
      date: form.date,
      worker: form.worker,
      role: form.role,
      ccId: form.ccId as unknown as CostCodeId,
      hours: parseAmount(form.hours),
      rate: parseAmount(form.rate),
      notes: form.notes,
    }
    dispatch({ type: 'ADD_TIMESHEET', projectId: project.id, timesheet })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Log Time"
      footer={<Button onClick={save}>Log Time</Button>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field
          label="Worker Name"
          required
          error={attempted && !form.worker.trim() ? 'Required' : undefined}
        >
          <Input
            value={form.worker}
            onChange={(e) => setForm({ ...form, worker: e.target.value })}
            invalid={attempted && !form.worker.trim()}
          />
        </Field>
        <Field label="Role">
          <Input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="Builder / Carpenter..."
          />
        </Field>
        <Field label="Cost Code">
          <Select value={form.ccId} onChange={(e) => setForm({ ...form, ccId: e.target.value })}>
            {project.codes.map((c) => (
              <option key={c.id} value={c.id as string}>
                {c.code} — {c.desc}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hours" required error={attempted && !form.hours ? 'Required' : undefined}>
          <Input
            type="number"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            invalid={attempted && !form.hours}
          />
        </Field>
        <Field label="Rate ($/hr)">
          <Input
            type="number"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}
