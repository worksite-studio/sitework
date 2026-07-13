import { useState } from 'react'
import { Button, Dialog, Field, Input, Select } from '@/components/ui'
import { useDispatch } from '@/state/context'
import { newId } from '@/lib/newId'
import { asId } from '@/types'
import type {
  PrimeCostItem,
  PrimeCostItemId,
  ProjectId,
  ProvisionalSum,
  ProvisionalSumId,
} from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  projectId: ProjectId
  kind: 'pc' | 'ps'
  initial?: PrimeCostItem | ProvisionalSum
}

// Legacy pcf / psf status option sets, verbatim.
const PC_STATUSES = ['Pending', 'Selected', 'Procured', 'Reconciled'] as const
const PS_STATUSES = ['Pending', 'InProgress', 'Complete', 'Reconciled'] as const
const PS_LABELS: Record<string, string> = { InProgress: 'In Progress' }

/**
 * PC / PS item add + edit — transliteration of legacy `pcf` / `psf` (R6,
 * PARITY gap 5): Description (required, placeholder per kind), Allowance
 * ($ ex GST, must be > 0), Margin Rate (0.2 = 20%), Actual Cost ($ ex GST),
 * Status (kind-specific set), red-outline Delete with confirm on edit.
 */
export function PcPsForm({ open, onClose, projectId, kind, initial }: Props) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(() => ({
    description: initial?.description ?? '',
    allowance: String(initial?.allowance ?? 0),
    marginRate: String(initial?.marginRate ?? 0.2),
    actualCost: String(initial?.actualCost ?? 0),
    status: (initial?.status as string) ?? 'Pending',
  }))
  const [attempted, setAttempted] = useState(false)
  const isEdit = !!initial

  const descMissing = form.description.trim() === ''
  const allowanceInvalid = !((parseFloat(form.allowance) || 0) > 0)
  const statuses = kind === 'pc' ? PC_STATUSES : PS_STATUSES

  function save() {
    if (descMissing || allowanceInvalid) {
      setAttempted(true)
      return
    }
    const fields = {
      description: form.description,
      allowance: parseFloat(form.allowance) || 0,
      marginRate: parseFloat(form.marginRate) || 0.2,
      actualCost: parseFloat(form.actualCost) || 0,
    }
    if (kind === 'pc') {
      const status = form.status as PrimeCostItem['status']
      if (isEdit && initial) {
        dispatch({
          type: 'UPDATE_PC_ITEM',
          projectId,
          itemId: initial.id as PrimeCostItemId,
          patch: { ...fields, status },
        })
      } else {
        dispatch({
          type: 'ADD_PC_ITEM',
          projectId,
          item: { id: asId<PrimeCostItemId>(newId('PC')), ...fields, status },
        })
      }
    } else {
      const status = form.status as ProvisionalSum['status']
      if (isEdit && initial) {
        dispatch({
          type: 'UPDATE_PS_ITEM',
          projectId,
          itemId: initial.id as ProvisionalSumId,
          patch: { ...fields, status },
        })
      } else {
        dispatch({
          type: 'ADD_PS_ITEM',
          projectId,
          item: { id: asId<ProvisionalSumId>(newId('PS')), ...fields, status },
        })
      }
    }
    onClose()
  }

  function remove() {
    if (!initial) return
    // Legacy pcf/psf confirm copy, verbatim.
    if (!window.confirm(`Delete this ${kind.toUpperCase()} item?`)) return
    if (kind === 'pc') {
      dispatch({ type: 'DELETE_PC_ITEM', projectId, itemId: initial.id as PrimeCostItemId })
    } else {
      dispatch({ type: 'DELETE_PS_ITEM', projectId, itemId: initial.id as ProvisionalSumId })
    }
    onClose()
  }

  const kindLabel = kind === 'pc' ? 'PC Item' : 'PS Item'
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${kindLabel}` : `Add ${kindLabel}`}
      footer={
        <>
          {isEdit ? (
            <button
              type="button"
              onClick={remove}
              className="cursor-pointer bg-transparent px-4 py-2 text-[12px] font-semibold"
              style={{ border: '1px solid var(--sw-neg)', color: 'var(--sw-neg)' }}
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <Button onClick={save}>{isEdit ? 'Save Changes' : `Add ${kindLabel}`}</Button>
        </>
      }
    >
      <Field label="Description" required error={attempted && descMissing ? 'Required' : undefined}>
        <Input
          autoFocus
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          invalid={attempted && descMissing}
          placeholder={kind === 'pc' ? 'e.g. Tapware allowance' : 'e.g. Excavation'}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Allowance ($ ex GST)"
          required
          error={attempted && allowanceInvalid ? 'Must be greater than 0' : undefined}
        >
          <Input
            type="number"
            step="0.01"
            value={form.allowance}
            onChange={(e) => setForm({ ...form, allowance: e.target.value })}
            invalid={attempted && allowanceInvalid}
          />
        </Field>
        <Field label="Margin Rate (0.2 = 20%)">
          <Input
            type="number"
            step="0.01"
            value={form.marginRate}
            onChange={(e) => setForm({ ...form, marginRate: e.target.value })}
          />
        </Field>
        <Field label="Actual Cost ($ ex GST)">
          <Input
            type="number"
            step="0.01"
            value={form.actualCost}
            onChange={(e) => setForm({ ...form, actualCost: e.target.value })}
          />
        </Field>
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {PS_LABELS[s] ?? s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Dialog>
  )
}
