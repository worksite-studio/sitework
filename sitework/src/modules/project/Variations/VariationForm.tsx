import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { parseAmount } from '@/lib/money'
import { useDispatch } from '@/state/context'
import { CostCodeSelect } from '../CostCodeSelect'
import { asId } from '@/types'
import type {
  CostCodeId,
  ProjectId,
  Variation,
  VariationId,
  VariationReasonCategory,
  VariationRequestedBy,
  VariationStatus,
} from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  codes: Array<{ id: CostCodeId; code: string; desc: string }>
  initial?: Variation
  /** Next positional number for the auto "VO-00N" id (legacy `v1` nextNum). */
  nextNum?: number
}

// Legacy v1 option sets, verbatim (labels spaced; values stay camel-case).
const REQUESTED_BY: VariationRequestedBy[] = ['Owner', 'Builder', 'Architect', 'Other']
const REASONS: Array<{ value: VariationReasonCategory; label: string }> = [
  { value: 'OwnerRequested', label: 'Owner Requested' },
  { value: 'LatentCondition', label: 'Latent Condition' },
  { value: 'Regulatory', label: 'Regulatory' },
  { value: 'DesignClarification', label: 'Design Clarification' },
  { value: 'BuilderFault', label: 'Builder Fault' },
  { value: 'Other', label: 'Other' },
]
const STATUSES: VariationStatus[] = ['Pending', 'Approved', 'Rejected']

/**
 * Variation add/edit — transliteration of legacy `v1` (R6, PARITY gap 4):
 * editable mono Variation ID (auto "VO-00N"), Requested By (default Owner),
 * Cost Code ("code — desc"), Amount, Description (required), Status
 * (Pending/Approved/Rejected — legacy has no Disputed option), Date,
 * Reason Category incl. Other, Time Impact (days), and the two conditional
 * comment fields (reasonCategory Other → "Comment / Reason Detail";
 * requestedBy Other → "Requested By — Comment").
 */
export function VariationForm({ open, onClose, projectId, codes, initial, nextNum }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, idText: initial.id as string }
      : {
          idText: `VO-${String(nextNum ?? 1).padStart(3, '0')}`,
          ccId: (codes[0]?.id ?? '') as CostCodeId,
          desc: '',
          amount: 0,
          status: 'Pending' as VariationStatus,
          date: new Date().toISOString().slice(0, 10),
          requestedBy: 'Owner' as VariationRequestedBy,
          reasonCategory: 'OwnerRequested' as VariationReasonCategory,
          reasonComment: '',
          requestedByComment: '',
          timeImpactDays: 0,
        },
  )
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial
  const descMissing = form.desc.trim() === ''

  function save() {
    if (descMissing) {
      setAttempted(true)
      return
    }
    const fields = {
      ccId: form.ccId,
      desc: form.desc,
      amount: parseAmount(form.amount),
      status: form.status,
      date: form.date,
      requestedBy: form.requestedBy,
      requestedByComment: form.requestedByComment,
      reasonCategory: form.reasonCategory,
      reasonComment: form.reasonComment,
      timeImpactDays: parseAmount(form.timeImpactDays),
    }
    if (isEdit && initial) {
      dispatch({ type: 'UPDATE_VARIATION', projectId, variationId: initial.id, patch: fields })
    } else {
      const id = asId<VariationId>(form.idText || `VO-${String(nextNum ?? 1).padStart(3, '0')}`)
      dispatch({ type: 'ADD_VARIATION', projectId, variation: { id, ...fields } })
    }
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Variation' : 'New Variation'}
      widthClass="max-w-xl"
      footer={<Button onClick={save}>Save Variation</Button>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Variation ID">
          <Input
            className="font-mono"
            value={form.idText}
            onChange={(e) => setForm({ ...form, idText: e.target.value })}
            disabled={isEdit}
          />
        </Field>
        <Field label="Requested By">
          <Select
            value={form.requestedBy ?? 'Owner'}
            onChange={(e) =>
              setForm({ ...form, requestedBy: e.target.value as VariationRequestedBy })
            }
          >
            {REQUESTED_BY.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cost Code">
          <CostCodeSelect
            projectId={projectId}
            codes={codes}
            value={form.ccId as string}
            onChange={(cc) => setForm({ ...form, ccId: cc as CostCodeId })}
          />
        </Field>
        <Field label="Amount">
          <Input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseAmount(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Description" required error={attempted && descMissing ? 'Required' : undefined}>
        <Input
          value={form.desc}
          onChange={(e) => setForm({ ...form, desc: e.target.value })}
          invalid={attempted && descMissing}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as VariationStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
        <Field label="Reason Category">
          <Select
            value={form.reasonCategory}
            onChange={(e) =>
              setForm({ ...form, reasonCategory: e.target.value as VariationReasonCategory })
            }
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Time Impact (days)">
          <Input
            type="number"
            value={form.timeImpactDays}
            onChange={(e) => setForm({ ...form, timeImpactDays: parseAmount(e.target.value) })}
          />
        </Field>
      </div>
      {form.reasonCategory === 'Other' && (
        <Field label="Comment / Reason Detail">
          <Input
            value={form.reasonComment ?? ''}
            onChange={(e) => setForm({ ...form, reasonComment: e.target.value })}
            placeholder="Describe the reason for this variation"
          />
        </Field>
      )}
      {form.requestedBy === 'Other' && (
        <Field label="Requested By — Comment">
          <Input
            value={form.requestedByComment ?? ''}
            onChange={(e) => setForm({ ...form, requestedByComment: e.target.value })}
            placeholder="Specify who requested this"
          />
        </Field>
      )}
    </Dialog>
  )
}
