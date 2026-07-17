import { useState } from 'react'
import { Button, Dialog, Field, Input, Select, Textarea } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { FilePicker } from '@/components/FilePicker'
import { useAppState, useDispatch } from '@/state/context'
import { asId } from '@/types'
import { checkSubstantiation } from '@/lib/substantiation'
import { newId } from '@/lib/newId'
import type {
  CostCodeId,
  FileAttachment,
  Invoice,
  InvoiceId,
  InvoiceStatus,
  Project,
} from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
  initial?: Invoice
}

const STATUSES: InvoiceStatus[] = ['Pending', 'Approved', 'Paid', 'Disputed']

const blank = (firstCodeId?: CostCodeId): Omit<Invoice, 'id'> => ({
  ccId: (firstCodeId ?? ('' as unknown as CostCodeId)) as CostCodeId,
  supplier: '',
  subId: '',
  docRef: '',
  amount: 0,
  status: 'Pending',
  date: new Date().toISOString().slice(0, 10),
  due: '',
  xero: false,
  notes: '',
  supportingDocs: [],
})

/**
 * InvFormV2 port. Substantiation rule (Phase 1.5-A): cost-plus projects
 * require at least one supportingDocs entry before save proceeds; the
 * checkSubstantiation() helper encodes the rule so it stays in sync with
 * ClaimForm.
 */
export function InvoiceForm({ open, onClose, project, initial }: Props) {
  const state = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Invoice, 'id'>>(() =>
    initial
      ? { ...initial, supportingDocs: initial.supportingDocs ?? [] }
      : blank(project.codes[0]?.id),
  )
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial

  const supplierMissing = form.supplier.trim() === ''
  const codeMissing = !(form.ccId as string)
  const subCheck = checkSubstantiation(project, form.supportingDocs)

  function reset() {
    setForm(blank(project.codes[0]?.id))
    setAttempted(false)
  }

  function save() {
    if (supplierMissing || codeMissing || subCheck.blocked) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_INVOICE',
        projectId: project.id,
        invoiceId: initial.id,
        patch: form,
      })
    } else {
      const id = asId<InvoiceId>(newId('INV'))
      dispatch({ type: 'ADD_INVOICE', projectId: project.id, invoice: { id, ...form } })
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
      title={isEdit ? 'Edit Invoice' : 'New Invoice'}
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
      <Field label="Subcontractor">
        <Select
          value={form.subId ?? ''}
          onChange={(e) => {
            const sub = state.subs.find((s) => (s.id as string) === e.target.value)
            setForm({
              ...form,
              subId: e.target.value,
              supplier: sub ? sub.name : form.supplier,
            })
          }}
        >
          <option value="">— Select subcontractor —</option>
          {state.subs.map((s) => (
            <option key={s.id as string} value={s.id as string}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Supplier / subcontractor"
          required
          error={attempted && supplierMissing ? 'Required' : undefined}
        >
          <Input
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            invalid={attempted && supplierMissing}
          />
        </Field>
        <Field label="Cost code" required error={attempted && codeMissing ? 'Required' : undefined}>
          <Select
            value={form.ccId as string}
            onChange={(e) => setForm({ ...form, ccId: e.target.value as CostCodeId })}
          >
            <option value="">— choose code —</option>
            {project.codes.map((c) => (
              <option key={c.id} value={c.id as string}>
                {c.code} · {c.desc}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Document Reference">
        <Input
          value={form.docRef ?? ''}
          onChange={(e) => setForm({ ...form, docRef: e.target.value })}
          placeholder="e.g. INV-2041"
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Amount (ex GST)">
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
          onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Notes">
        <Textarea
          value={form.notes ?? ''}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Anything worth remembering about this invoice…"
          rows={2}
        />
      </Field>

      {project.contractType === 'cost-plus' && (
        <Field
          label="Supporting documents"
          required
          hint="Cost-plus projects require receipts / timesheets / sub invoices substantiating every dollar claimed."
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
