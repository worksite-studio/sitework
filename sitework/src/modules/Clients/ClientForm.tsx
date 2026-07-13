import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId, type Client, type ClientId } from '@/types'
import { newId } from '@/lib/newId'

interface ClientFormProps {
  open: boolean
  onClose: () => void
  /** Existing client when editing; omit for add. */
  initial?: Client
}

const blank = (): Omit<Client, 'id'> => ({
  name: '',
  abn: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
})

/**
 * Client add/edit dialog. Port of legacy `m1`. Required fields highlight
 * red on save-attempt — matches the legacy validation pattern (Field's
 * `error` prop drives the styling).
 */
export function ClientForm({ open, onClose, initial }: ClientFormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Client, 'id'>>(() => (initial ? { ...initial } : blank()))
  const [attempted, setAttempted] = useState(false)

  const isEdit = !!initial
  const nameMissing = form.name.trim() === ''

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
      dispatch({ type: 'UPDATE_CLIENT', clientId: initial.id, patch: form })
    } else {
      const id = asId<ClientId>(newId('CLI'))
      dispatch({ type: 'ADD_CLIENT', client: { id, ...form } })
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
      title={isEdit ? 'Edit Client' : 'New Client'}
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
          <Button onClick={save}>Save Client</Button>
        </>
      }
    >
      {/* Legacy m1 labels + full-width stacked layout (R7). */}
      <Field
        label="Company / Client Name"
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
      <Field label="Contact Name">
        <Input
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
        />
      </Field>
      <Field label="Phone">
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
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
