import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { asId } from '@/types'
import type { CostCodeId, Project, Purchase, PurchaseId } from '@/types'
import { newId } from '@/lib/newId'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
}

/**
 * Transliteration of legacy `POFormV2` (R2): Subcontractor select that
 * auto-fills the supplier name, free-text Supplier fallback, Document
 * Reference, Cost Code, Description, Amount (ex GST) with a live GST
 * preview strip, Date. No status field — every new PO starts `pending`
 * (the table's RECEIVE action moves it on). Auto-numbers `poNum` as
 * "PO-00N". Save requires a supplier or subcontractor.
 */
export function POForm({ open, onClose, project }: Props) {
  const state = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState({
    subId: '',
    supplier: '',
    docRef: '',
    desc: '',
    ccId: (project.codes[0]?.id as string) ?? '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
  })
  const [attempted, setAttempted] = useState(false)

  const supplierMissing = form.supplier.trim() === '' && form.subId === ''

  function reset() {
    setForm({
      subId: '',
      supplier: '',
      docRef: '',
      desc: '',
      ccId: (project.codes[0]?.id as string) ?? '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
    })
    setAttempted(false)
  }

  function save() {
    if (supplierMissing) {
      setAttempted(true)
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
      amount: Number(form.amount) || 0,
      status: 'pending',
      date: form.date,
      dueDate: '',
      receivedDate: null,
      notes: '',
    }
    dispatch({ type: 'ADD_PURCHASE', projectId: project.id, purchase })
    reset()
    onClose()
  }

  const amt = Number(form.amount) || 0

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="New Purchase Order"
      widthClass="max-w-xl"
      footer={<Button onClick={save}>Save Purchase Order</Button>}
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
          <Select
            value={form.ccId}
            onChange={(e) => setForm({ ...form, ccId: e.target.value })}
            disabled={project.codes.length === 0}
          >
            {project.codes.length === 0 ? (
              <option value="">— No cost codes — add one in BOQ tab first —</option>
            ) : (
              project.codes.map((c) => (
                <option key={c.id} value={c.id as string}>
                  {c.code} {c.desc}
                </option>
              ))
            )}
          </Select>
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
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
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
            GST: <strong className="font-mono text-sw-ink">{formatCurrency(amt * 0.1)}</strong>
          </span>
          <span>
            Total: <strong className="font-mono text-sw-ink">{formatCurrency(amt * 1.1)}</strong>
          </span>
        </div>
      )}
    </Dialog>
  )
}
