import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { FilePicker } from '@/components/FilePicker'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import { checkSubstantiation } from '@/lib/substantiation'
import { newId } from '@/lib/newId'
import type {
  FileAttachment,
  ProgressClaim,
  ProgressClaimId,
  ProgressClaimStatus,
  Project,
} from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
  initial?: ProgressClaim
  /** Pre-filled claim number for new claims (session-28 fix). */
  nextNo?: number
}

const STATUSES: ProgressClaimStatus[] = [
  'Draft',
  'Issued',
  'Pending',
  'Approved',
  'Paid',
  'Disputed',
]

const blank = (nextNo = 1): Omit<ProgressClaim, 'id'> => ({
  claimNo: nextNo,
  desc: '',
  date: new Date().toISOString().slice(0, 10),
  due: '',
  amount: 0,
  status: 'Draft',
  notes: '',
  madeUnderSOPAct: false,
  sopActState: '',
  supportingDocs: [],
})

/**
 * ClaimForm1 port. Two-bug history from sessions 26–28 baked into the
 * design:
 *
 * 1. Substantiation gate (Phase 1.5-A) — cost-plus projects require ≥1
 *    supportingDoc before save. Shared with InvoiceForm via the
 *    checkSubstantiation() helper.
 *
 * 2. claimNo numbering — auto-filled into the form for new claims
 *    (nextNo prop), preserved on edit. The reducer also fills missing
 *    claimNo so legacy records that pre-date the session-28 fix still
 *    sequence cleanly.
 */
export function ClaimForm({ open, onClose, project, initial, nextNo = 1 }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<ProgressClaim, 'id'>>(() =>
    initial
      ? {
          ...initial,
          // Heal legacy records missing claimNo (Cl1 list cell defensive fallback from session 28).
          claimNo: initial.claimNo || nextNo,
          supportingDocs: initial.supportingDocs ?? [],
        }
      : blank(nextNo),
  )
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial

  const descMissing = form.desc.trim() === ''
  const subCheck = checkSubstantiation(project, form.supportingDocs)

  function reset() {
    setForm(blank(nextNo))
    setAttempted(false)
  }

  function save() {
    if (descMissing || subCheck.blocked) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_CLAIM',
        projectId: project.id,
        claimId: initial.id,
        patch: form,
      })
    } else {
      const id = asId<ProgressClaimId>(newId('CLM'))
      dispatch({ type: 'ADD_CLAIM', projectId: project.id, claim: { id, ...form } })
    }
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={isEdit ? `Edit claim #${form.claimNo}` : `New claim #${form.claimNo}`}
      widthClass="max-w-xl"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-[120px_1fr] gap-3">
        <Field label="Claim no.">
          <Input
            type="number"
            min={1}
            value={form.claimNo}
            onChange={(e) => setForm({ ...form, claimNo: parseAmount(e.target.value, 1) })}
          />
        </Field>
        <Field
          label="Description"
          required
          error={attempted && descMissing ? 'Required' : undefined}
        >
          <Input
            autoFocus
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            invalid={attempted && descMissing}
            placeholder="e.g. Stage 3 — Lockup"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Amount inc GST">
          <Input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseAmount(e.target.value) })}
          />
        </Field>
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Due">
          <Input
            type="date"
            value={form.due}
            onChange={(e) => setForm({ ...form, due: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ProgressClaimStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>

      {project.contractType === 'cost-plus' && (
        <Field
          label="Supporting documents"
          required
          hint="Cost-plus projects require receipts / timesheets / sub invoices substantiating the claim."
          error={attempted && subCheck.blocked ? subCheck.reason : undefined}
        >
          <FilePicker
            value={form.supportingDocs ?? []}
            onChange={(docs: FileAttachment[]) => setForm({ ...form, supportingDocs: docs })}
            invalid={attempted && subCheck.blocked}
          />
        </Field>
      )}
    </Dialog>
  )
}
