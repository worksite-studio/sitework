import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type { CostCode, CostCodeId, ProjectId } from '@/types'
import { newId } from '@/lib/newId'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  initial?: CostCode
  /** Pre-filled code string when adding (auto-numbered by the BOQ tab). */
  nextCode?: string
}

const blank = (nextCode = ''): Omit<CostCode, 'id'> => ({
  code: nextCode,
  desc: '',
  budget: 0,
  committed: 0,
  actual: 0,
  vars: 0,
})

/**
 * Cost code add/edit dialog. Port of legacy `p1`. Auto-numbered Code field
 * for new rows (Session 28 / Phase 1.5-B fix that surfaced the real BOQ
 * dropdown bug); Desc + Budget required to save.
 */
export function CostCodeForm({ open, onClose, projectId, initial, nextCode }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<CostCode, 'id'>>(() =>
    initial ? { ...initial } : blank(nextCode),
  )
  const [attempted, setAttempted] = useState(false)

  const isEdit = !!initial
  const codeMissing = form.code.trim() === ''
  const descMissing = form.desc.trim() === ''

  function reset() {
    setForm(blank(nextCode))
    setAttempted(false)
  }

  function save() {
    if (codeMissing || descMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_CODE', projectId, codeId: initial.id, patch: form })
    } else {
      const id = asId<CostCodeId>(newId('CC'))
      dispatch({ type: 'ADD_CODE', projectId, code: { id, ...form } })
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
      title={isEdit ? 'Edit Cost Code' : 'Add Cost Code'}
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
      <div className="grid grid-cols-[100px_1fr] gap-3">
        <Field label="Code" required error={attempted && codeMissing ? 'Required' : undefined}>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            invalid={attempted && codeMissing}
            placeholder="001"
          />
        </Field>
        <Field
          label="Description"
          required
          error={attempted && descMissing ? 'Required' : undefined}
        >
          <Input
            autoFocus
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
            invalid={attempted && descMissing}
            placeholder="e.g. Preliminary Costs"
          />
        </Field>
      </div>
      <Field label="Budget ($)">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })}
        />
      </Field>
    </Dialog>
  )
}
