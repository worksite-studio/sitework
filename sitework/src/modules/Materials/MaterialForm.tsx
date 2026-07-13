import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { useAppState, useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { Material, MaterialId, SupplierId } from '@/types'
import { newId } from '@/lib/newId'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Material
}

const blank = (): Omit<Material, 'id'> => ({
  name: '',
  cat: '',
  unit: 'each',
  price: 0,
  supId: '' as unknown as SupplierId,
  sku: '',
})

export function MaterialForm({ open, onClose, initial }: Props) {
  const { suppliers } = useAppState()
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Material, 'id'>>(() => (initial ? { ...initial } : blank()))
  const [attempted, setAttempted] = useState(false)
  const nameMissing = form.name.trim() === ''
  const isEdit = !!initial

  function reset() {
    setForm(blank())
    setAttempted(false)
  }

  function save() {
    if (nameMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_MATERIAL', materialId: initial.id, patch: form })
    } else {
      const id = asId<MaterialId>(newId('MAT'))
      dispatch({ type: 'ADD_MATERIAL', material: { id, ...form } })
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
      title={isEdit ? `Edit ${initial?.name || 'material'}` : 'New material'}
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
      <Field
        label="Name"
        required
        error={attempted && nameMissing ? 'Name is required' : undefined}
      >
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          invalid={attempted && nameMissing}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Input
            value={form.cat}
            onChange={(e) => setForm({ ...form, cat: e.target.value })}
            placeholder="e.g. Cladding"
          />
        </Field>
        <Field label="SKU">
          <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Unit">
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </Field>
        <Field label="Unit price ($)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseAmount(e.target.value) })}
          />
        </Field>
        <Field label="Supplier">
          <Select
            value={form.supId as string}
            onChange={(e) => setForm({ ...form, supId: e.target.value as unknown as SupplierId })}
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id as string}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  )
}
