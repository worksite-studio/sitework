import { useState } from 'react'
import { Button, Dialog, Field, Input, Select, useToast } from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { gstOf, incGst, parseAmount } from '@/lib/money'
import { asId } from '@/types'
import type { CostCodeId, Project, Purchase, PurchaseId } from '@/types'
import { newId } from '@/lib/newId'
import { CostCodeSelect } from '../CostCodeSelect'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
  /** When set, the form edits this PO instead of creating a new one. */
  initial?: Purchase
}

/**
 * Transliteration of legacy `POFormV2` (R2): Subcontractor select that
 * auto-fills the supplier name, free-text Supplier fallback, Document
 * Reference, Cost Code, Description, Amount (ex GST) with a live GST
 * preview strip, Date. No status field — every new PO starts `pending`
 * (the table's RECEIVE action moves it on). Auto-numbers `poNum` as
 * "PO-00N". Save requires a supplier or subcontractor.
 */
export function POForm({ open, onClose, project, initial }: Props) {
  const state = useAppState()
  const dispatch = useDispatch()
  const { toast } = useToast()
  const isEdit = !!initial
  const blank = {
    subId: '',
    supplier: '',
    docRef: '',
    desc: '',
    ccId: (project.codes[0]?.id as string) ?? '',
    amount: 0 as number,
    date: new Date().toISOString().slice(0, 10),
  }
  const [form, setForm] = useState(
    initial
      ? {
          subId: (initial.subId as string) ?? '',
          supplier: initial.supplier ?? '',
          docRef: initial.docRef ?? '',
          desc: initial.desc ?? '',
          ccId: initial.ccId as unknown as string,
          amount: initial.amount ?? 0,
          date: initial.date ?? new Date().toISOString().slice(0, 10),
        }
      : blank,
  )
  const [attempted, setAttempted] = useState(false)

  const supplierMissing = form.supplier.trim() === '' && form.subId === ''

  function reset() {
    setForm(blank)
    setAttempted(false)
  }

  function save() {
    if (supplierMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_PURCHASE',
        projectId: project.id,
        purchaseId: initial.id,
        patch: {
          ccId: form.ccId as unknown as CostCodeId,
          supplier: form.supplier,
          subId: form.subId || null,
          docRef: form.docRef,
          desc: form.desc,
          amount: parseAmount(form.amount),
          date: form.date,
        },
      })
      toast('Purchase order updated', 'success')
      onClose()
      return
    }
    const poCount = (state.purchases[project.id as string] ?? []).length
    const purchase: Purchase = {
      id: asId<PurchaseId>(newId('PO')),
      poNum: `PO-${String(poCount + 1).padStart(3, '0')}`,
      ccId: form.ccId as unknown as CostCodeId,
      supplier: form.supplier,
      subId: form.subId || null,
      docRef: form.docRef,
      desc: form.desc,
      amount: parseAmount(form.amount),
      status: 'pending',
      date: form.date,
      dueDate: '',
      receivedDate: null,
      notes: '',
    }
    dispatch({ type: 'ADD_PURCHASE', projectId: project.id, purchase })
    toast('Purchase order created', 'success')
    reset()
    onClose()
  }

  const amt = parseAmount(form.amount)

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}
      widthClass="max-w-xl"
      footer={<Button onClick={save}>{isEdit ? 'Save Changes' : 'Save Purchase Order'}</Button>}
    >
      <Field label="Subcontractor">
        <Select
          value={form.subId}
          onChange={(e) => {
            const sub = state.subs.find((s) => (s.id as string) === e.target.value)
            setForm({ ...form, subId: e.target.value, supplier: sub ? sub.name : form.supplier })
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
      <Field
        label="Supplier (if not a subcontractor)"
        error={attempted && supplierMissing ? 'Supplier or subcontractor required' : undefined}
      >
        <Input
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          invalid={attempted && supplierMissing}
          placeholder="Leave blank if subcontractor selected"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Document Reference">
          <Input
            value={form.docRef}
            onChange={(e) => setForm({ ...form, docRef: e.target.value })}
            placeholder="e.g. PO-0042"
          />
        </Field>
        <Field label="Cost Code">
          <CostCodeSelect
            projectId={project.id}
            codes={project.codes}
            value={form.ccId}
            onChange={(cc) => setForm({ ...form, ccId: cc })}
          />
        </Field>
      </div>
      <Field label="Description">
        <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      {amt > 0 && (
        <div className="flex gap-8 rounded-[1px] bg-sw-bg px-3.5 py-2.5 text-[12px] text-sw-dim">
          <span>
            Ex GST: <strong className="font-mono text-sw-ink">{formatCurrency(amt)}</strong>
          </span>
          <span>
            GST: <strong className="font-mono text-sw-ink">{formatCurrency(gstOf(amt))}</strong>
          </span>
          <span>
            Total: <strong className="font-mono text-sw-ink">{formatCurrency(incGst(amt))}</strong>
          </span>
        </div>
      )}
    </Dialog>
  )
}
