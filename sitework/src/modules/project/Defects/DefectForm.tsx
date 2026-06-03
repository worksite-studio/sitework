import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { Defect, DefectId, DefectStatus, ProjectId } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  initial?: Defect
}

const STATUSES: DefectStatus[] = ['Open', 'Rectified', 'Disputed']

const blank = (): Omit<Defect, 'id'> => ({
  item: '',
  location: '',
  trade: '',
  dateLogged: new Date().toISOString().slice(0, 10),
  dateRectified: null,
  status: 'Open',
  notes: '',
})

export function DefectForm({ open, onClose, projectId, initial }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Defect, 'id'>>(() => (initial ? { ...initial } : blank()))
  const [attempted, setAttempted] = useState(false)
  const itemMissing = form.item.trim() === ''
  const isEdit = !!initial

  function reset() {
    setForm(blank())
    setAttempted(false)
  }
  function save() {
    if (itemMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_DEFECT', projectId, defectId: initial.id, patch: form })
    } else {
      const id = asId<DefectId>(`DEF-${Date.now()}`)
      dispatch({ type: 'ADD_DEFECT', projectId, defect: { id, ...form } })
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
      title={isEdit ? `Edit defect ${initial?.id}` : 'New defect'}
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
      <Field label="Item" required error={attempted && itemMissing ? 'Required' : undefined}>
        <Input
          autoFocus
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
          invalid={attempted && itemMissing}
          placeholder="e.g. Plasterboard gap at cornice"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Location">
          <Input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Master Bedroom"
          />
        </Field>
        <Field label="Trade">
          <Input
            value={form.trade}
            onChange={(e) => setForm({ ...form, trade: e.target.value })}
            placeholder="e.g. Plastering"
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Logged">
          <Input
            type="date"
            value={form.dateLogged}
            onChange={(e) => setForm({ ...form, dateLogged: e.target.value })}
          />
        </Field>
        <Field label="Rectified">
          <Input
            type="date"
            value={form.dateRectified ?? ''}
            onChange={(e) => setForm({ ...form, dateRectified: e.target.value || null })}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as DefectStatus })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}
