import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { useAppState, useDispatch } from '@/state/context'
import { newId } from '@/lib/newId'
import { asId } from '@/types'
import type { ClientId, Estimate, EstimateCode, EstimateCodeId, EstimateId } from '@/types'

interface EstimateFormProps {
  open: boolean
  onClose: () => void
  initial?: Estimate
}

/**
 * Transliteration of legacy `h1` (R5): Estimate Name / Client / Address /
 * Target Margin % (default 20). New estimates start `draft` with no codes;
 * edit patches the same four fields.
 */
export function EstimateForm({ open, onClose, initial }: EstimateFormProps) {
  const { clients } = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    clientId: (initial?.clientId as string) ?? (clients[0]?.id as string) ?? '',
    address: initial?.address ?? '',
    margin: String(initial?.margin ?? 20),
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial

  function save() {
    if (!form.name.trim()) {
      setAttempted(true)
      return
    }
    const patch = {
      name: form.name,
      clientId: form.clientId as unknown as ClientId,
      address: form.address,
      margin: parseAmount(form.margin, 20),
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_ESTIMATE', estimateId: initial.id, patch })
    } else {
      dispatch({
        type: 'ADD_ESTIMATE',
        estimate: {
          id: asId<EstimateId>(newId('EST')),
          ...patch,
          status: 'draft',
          createdDate: new Date().toISOString().slice(0, 10),
          codes: [],
        },
      })
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Estimate' : 'New Estimate'}
      footer={<Button onClick={save}>{isEdit ? 'Save Changes' : 'Create Estimate'}</Button>}
    >
      <Field
        label="Estimate Name"
        required
        error={attempted && !form.name.trim() ? 'Required' : undefined}
      >
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          invalid={attempted && !form.name.trim()}
          placeholder="e.g. Smith Residence"
        />
      </Field>
      <Field label="Client">
        <Select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          {clients.map((c) => (
            <option key={c.id as string} value={c.id as string}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Address">
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </Field>
      <Field label="Target Margin %">
        <Input
          type="number"
          value={form.margin}
          onChange={(e) => setForm({ ...form, margin: e.target.value })}
        />
      </Field>
    </Dialog>
  )
}

interface EstCodeFormProps {
  open: boolean
  onClose: () => void
  estimateId: EstimateId
}

/** Transliteration of legacy `b1`: Code / Description / Budget → ADD_EST_CODE. */
export function EstCodeForm({ open, onClose, estimateId }: EstCodeFormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({ code: '', desc: '', budget: '' })
  const [attempted, setAttempted] = useState(false)

  function save() {
    if (!form.code.trim()) {
      setAttempted(true)
      return
    }
    const code: EstimateCode = {
      id: asId<EstimateCodeId>(newId('EC')),
      code: form.code,
      desc: form.desc,
      budget: parseAmount(form.budget),
    }
    dispatch({ type: 'ADD_EST_CODE', estimateId, code })
    setForm({ code: '', desc: '', budget: '' })
    setAttempted(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add Cost Code"
      footer={<Button onClick={save}>Add Code</Button>}
    >
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <Field
          label="Code"
          required
          error={attempted && !form.code.trim() ? 'Required' : undefined}
        >
          <Input
            autoFocus
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            invalid={attempted && !form.code.trim()}
            placeholder="001"
          />
        </Field>
        <Field label="Description">
          <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        </Field>
      </div>
      <Field label="Budget">
        <Input
          type="number"
          step="0.01"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        />
      </Field>
    </Dialog>
  )
}
