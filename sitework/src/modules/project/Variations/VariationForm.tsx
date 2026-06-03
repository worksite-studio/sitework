import { useState } from 'react'
import { Button, Dialog, Field, Input } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { asId } from '@/types'
import type {
  CostCodeId,
  ProjectId,
  Variation,
  VariationId,
  VariationReasonCategory,
  VariationStatus,
} from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  codes: Array<{ id: CostCodeId; code: string; desc: string }>
  initial?: Variation
}

const REASONS: VariationReasonCategory[] = [
  'OwnerRequested',
  'LatentCondition',
  'Regulatory',
  'DesignClarification',
  'BuilderFault',
]

const STATUSES: VariationStatus[] = ['Pending', 'Approved', 'Rejected', 'Disputed']

const blank = (firstCodeId?: CostCodeId): Omit<Variation, 'id'> => ({
  ccId: (firstCodeId ?? ('' as unknown as CostCodeId)) as CostCodeId,
  desc: '',
  amount: 0,
  status: 'Pending',
  date: new Date().toISOString().slice(0, 10),
  reasonCategory: 'OwnerRequested',
  timeImpactDays: 0,
})

export function VariationForm({ open, onClose, projectId, codes, initial }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Variation, 'id'>>(() =>
    initial ? { ...initial } : blank(codes[0]?.id),
  )
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  const descMissing = form.desc.trim() === ''
  const codeMissing = !(form.ccId as string)

  function reset() {
    setForm(blank(codes[0]?.id))
    setAttempted(false)
  }

  function save() {
    if (descMissing || codeMissing) {
      setAttempted(true)
      return
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_VARIATION', projectId, variationId: initial.id, patch: form })
    } else {
      const id = asId<VariationId>(`VO-${Date.now()}`)
      dispatch({ type: 'ADD_VARIATION', projectId, variation: { id, ...form } })
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
      title={isEdit ? `Edit variation ${initial?.id}` : 'New variation'}
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
      <Field label="Description" required error={attempted && descMissing ? 'Required' : undefined}>
        <Input
          autoFocus
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          invalid={attempted && descMissing}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost code" required error={attempted && codeMissing ? 'Required' : undefined}>
          <select
            value={form.ccId as string}
            onChange={(e) => setForm({ ...form, ccId: e.target.value as CostCodeId })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            <option value="">— choose code —</option>
            {codes.map((c) => (
              <option key={c.id} value={c.id as string}>
                {c.code} · {c.desc}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount ($)">
          <Input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as VariationStatus })}
            className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Time impact (days)">
          <Input
            type="number"
            min={0}
            value={form.timeImpactDays}
            onChange={(e) => setForm({ ...form, timeImpactDays: Number(e.target.value) || 0 })}
          />
        </Field>
      </div>
      <Field label="Reason category">
        <select
          value={form.reasonCategory}
          onChange={(e) =>
            setForm({ ...form, reasonCategory: e.target.value as VariationReasonCategory })
          }
          className="h-9 w-full rounded-md border border-sw-border px-3 text-sm bg-sw-surface"
        >
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
    </Dialog>
  )
}
