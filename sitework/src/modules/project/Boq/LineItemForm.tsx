import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import { newId } from '@/lib/newId'
import { asId } from '@/types'
import type { CostCodeId, LineItem, LineItemId, ProjectId, SupplierId } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  ccId: CostCodeId
}

// Legacy g1 unit options, verbatim.
const UNITS = ['allow', 'm²', 'm', 'lm', 'hr', 'item', 'tonne']

/**
 * Line-item add dialog — transliteration of legacy `g1` (R1): Description
 * (required), Qty (default 1), Unit select, Rate, Supplier select ("None" +
 * catalogue), "Save Line Item".
 */
export function LineItemForm({ open, onClose, projectId, ccId }: Props) {
  const state = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState({ desc: '', qty: 1, unit: 'allow', rate: 0, supId: '' })
  const [attempted, setAttempted] = useState(false)

  function reset() {
    setForm({ desc: '', qty: 1, unit: 'allow', rate: 0, supId: '' })
    setAttempted(false)
  }

  function save() {
    if (!form.desc.trim()) {
      setAttempted(true)
      return
    }
    const lineItem: LineItem = {
      id: asId<LineItemId>(newId('LI')),
      desc: form.desc,
      qty: Number(form.qty) || 1,
      unit: form.unit,
      rate: Number(form.rate) || 0,
      matId: null,
      supId: form.supId ? asId<SupplierId>(form.supId) : null,
    }
    dispatch({ type: 'ADD_LINE_ITEM', projectId, ccId, lineItem })
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
      title="Add Line Item"
      footer={<Button onClick={save}>Save Line Item</Button>}
    >
      <Field
        label="Description"
        required
        error={attempted && !form.desc.trim() ? 'Required' : undefined}
      >
        <Input
          autoFocus
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          invalid={attempted && !form.desc.trim()}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Qty">
          <Input
            type="number"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Unit">
          <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rate">
          <Input
            type="number"
            step="0.01"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Field label="Supplier">
        <Select value={form.supId} onChange={(e) => setForm({ ...form, supId: e.target.value })}>
          <option value="">None</option>
          {state.suppliers.map((s) => (
            <option key={s.id as string} value={s.id as string}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
    </Dialog>
  )
}
