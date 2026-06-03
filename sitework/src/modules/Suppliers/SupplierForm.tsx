import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { Supplier, SupplierId } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  initial?: Supplier
}

const blank = (): Omit<Supplier, 'id'> => ({
  name: '',
  abn: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
})

export function SupplierForm({ open, onClose, initial }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(() => (initial ? { ...initial } : blank()))
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
      dispatch({ type: 'UPDATE_SUPPLIER', supplierId: initial.id, patch: form })
    } else {
      const id = asId<SupplierId>(`SUP-${Date.now()}`)
      dispatch({ type: 'ADD_SUPPLIER', supplier: { id, ...form } })
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
      title={isEdit ? `Edit ${initial?.name || 'supplier'}` : 'New supplier'}
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
      <Field label="ABN">
        <Input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact">
          <Input
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Email">
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Address">
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </Field>
    </Dialog>
  )
}
