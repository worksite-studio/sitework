import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { CostCodeId, Project, Purchase, PurchaseId, PurchaseStatus } from '@/types'
import { newId } from '@/lib/newId'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
}

const STATUSES: PurchaseStatus[] = ['draft', 'sent', 'received']

const blank = (firstCodeId?: CostCodeId): Omit<Purchase, 'id'> => ({
  ccId: (firstCodeId ?? ('' as unknown as CostCodeId)) as CostCodeId,
  supplier: '',
  desc: '',
  amount: 0,
  status: 'draft',
  date: new Date().toISOString().slice(0, 10),
  dueDate: '',
  receivedDate: null,
  notes: '',
})

/**
 * POFormV2 port — add only. Edit is via the row's Receive button on the
 * tab (RECEIVE_PURCHASE for the common case), or a follow-up session can
 * port the full edit modal.
 */
export function POForm({ open, onClose, project }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Purchase, 'id'>>(() => blank(project.codes[0]?.id))
  const [attempted, setAttempted] = useState(false)
  const supplierMissing = form.supplier.trim() === ''
  const descMissing = form.desc.trim() === ''
  const codeMissing = !(form.ccId as string)

  function reset() {
    setForm(blank(project.codes[0]?.id))
    setAttempted(false)
  }

  function save() {
    if (supplierMissing || descMissing || codeMissing) {
      setAttempted(true)
      return
    }
    const id = asId<PurchaseId>(newId('PO'))
    dispatch({ type: 'ADD_PURCHASE', projectId: project.id, purchase: { id, ...form } })
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
      title="New purchase order"
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
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Supplier"
          required
          error={attempted && supplierMissing ? 'Required' : undefined}
        >
          <Input
            autoFocus
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
      <Field label="Description" required error={attempted && descMissing ? 'Required' : undefined}>
        <Input
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          invalid={attempted && descMissing}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Amount ($)">
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
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  )
}
