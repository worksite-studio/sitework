import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { Rfi, RfiId, RfiStatus } from '@/types'
import { newId } from '@/lib/newId'

/**
 * RFI Register — transliteration of legacy `RF1` + `RFIForm1` (R7, PARITY
 * gap-12 row): "N RFIs · N overdue" (pink) sub-line, overdue rows tinted
 * pink with a pink Required-By date, columns RFI # / Subject / Addressee /
 * Issued / Required By / Responded (date) / Status / Edit link, and the
 * New RFI / Update RFI modal.
 */
export function RfisTab() {
  const project = useProject()
  const state = useAppState()
  const [modal, setModal] = useState<'new' | { rfi: Rfi } | null>(null)
  if (!project) return null

  const rfis: Rfi[] = state.rfis[project.id as string] ?? []
  const today = new Date()
  const isOverdue = (r: Rfi) =>
    r.status === 'Open' && !!r.dateRequired && new Date(r.dateRequired) < today
  const overdue = rfis.filter(isOverdue)

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            RFI Register
          </h2>
          <div className="text-[13px] text-sw-dim">
            {rfis.length} RFIs
            {overdue.length > 0 && (
              <span className="ml-2 font-semibold" style={{ color: 'var(--sw-neg)' }}>
                {overdue.length} overdue
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setModal('new')}>+ New RFI</Button>
      </header>

      <div className="border-t border-sw-ink bg-white">
        <table className="sw-table">
          <thead>
            <tr>
              <th>RFI #</th>
              <th>Subject</th>
              <th>Addressee</th>
              <th>Issued</th>
              <th>Required By</th>
              <th>Responded</th>
              <th>Status</th>
              <th aria-label="Edit" />
            </tr>
          </thead>
          <tbody>
            {rfis.length > 0 ? (
              rfis.map((r) => {
                const ov = isOverdue(r)
                return (
                  <tr key={r.id as string} style={{ background: ov ? '#FEF2F2' : '#fff' }}>
                    <td className="font-mono text-sw-dim">RFI-{r.rfiNo}</td>
                    <td className="font-medium">{r.subject}</td>
                    <td className="text-sw-dim">{r.addressee}</td>
                    <td className="text-sw-dim">{formatDate(r.dateIssued)}</td>
                    <td style={{ color: ov ? 'var(--sw-neg)' : 'var(--sw-dim)' }}>
                      {formatDate(r.dateRequired)}
                    </td>
                    <td className="text-sw-dim">
                      {r.dateResponded ? formatDate(r.dateResponded) : '—'}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setModal({ rfi: r })}
                        className="cursor-pointer bg-transparent text-[11px] text-sw-ink hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-10 text-center text-[13px] text-sw-faint">
                  No RFIs logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === 'new' && <RfiForm onClose={() => setModal(null)} nextNo={rfis.length + 1} />}
      {modal !== null && modal !== 'new' && (
        <RfiForm onClose={() => setModal(null)} initial={modal.rfi} nextNo={modal.rfi.rfiNo} />
      )}
    </div>
  )
}

/** Legacy `RFIForm1` — subject/addressee/dates/response/status. */
function RfiForm({
  onClose,
  initial,
  nextNo,
}: {
  onClose: () => void
  initial?: Rfi
  nextNo: number
}) {
  const project = useProject()
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => ({
    subject: initial?.subject ?? '',
    addressee: initial?.addressee ?? '',
    dateIssued: initial?.dateIssued ?? new Date().toISOString().slice(0, 10),
    dateRequired: initial?.dateRequired ?? '',
    dateResponded: initial?.dateResponded ?? '',
    response: initial?.response ?? '',
    status: initial?.status ?? ('Open' as RfiStatus),
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  if (!project) return null

  function save() {
    if (!project) return
    if (!form.subject.trim()) {
      setAttempted(true)
      return
    }
    const fields = {
      subject: form.subject,
      addressee: form.addressee,
      dateIssued: form.dateIssued,
      dateRequired: form.dateRequired,
      dateResponded: form.dateResponded || null,
      response: form.response,
      status: form.status,
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_RFI', projectId: project.id, rfiId: initial.id, patch: fields })
    } else {
      dispatch({
        type: 'ADD_RFI',
        projectId: project.id,
        rfi: { id: asId<RfiId>(newId('RFI')), rfiNo: nextNo, ...fields },
      })
    }
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEdit ? 'Update RFI' : 'New RFI'}
      footer={<Button onClick={save}>Save RFI</Button>}
    >
      <Field
        label="Subject"
        required
        error={attempted && !form.subject.trim() ? 'Required' : undefined}
      >
        <Input
          autoFocus
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          invalid={attempted && !form.subject.trim()}
        />
      </Field>
      <Field label="Addressee">
        <Input
          value={form.addressee}
          onChange={(e) => setForm({ ...form, addressee: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date Issued">
          <Input
            type="date"
            value={form.dateIssued}
            onChange={(e) => setForm({ ...form, dateIssued: e.target.value })}
          />
        </Field>
        <Field label="Required By">
          <Input
            type="date"
            value={form.dateRequired}
            onChange={(e) => setForm({ ...form, dateRequired: e.target.value })}
          />
        </Field>
        <Field label="Date Responded">
          <Input
            type="date"
            value={form.dateResponded ?? ''}
            onChange={(e) => setForm({ ...form, dateResponded: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Response">
        <Input
          value={form.response}
          onChange={(e) => setForm({ ...form, response: e.target.value })}
        />
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as RfiStatus })}
        >
          <option value="Open">Open</option>
          <option value="Closed">Closed</option>
        </Select>
      </Field>
    </Dialog>
  )
}
