import { useState } from 'react'
import {
  Button,
  Dialog,
  Field,
  Input,
  Select,
  Textarea,
  useConfirm,
  useToast,
} from '@/components/ui'
import { useAppState, useDispatch } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { gstOf, incGst, parseAmount } from '@/lib/money'
import { newId } from '@/lib/newId'
import { asId } from '@/types'
import type {
  CostCodeId,
  Project,
  ScopeLineId,
  Subcontract,
  SubcontractId,
  SubcontractStatus,
  SubcontractorId,
} from '@/types'
import { CostCodeSelect } from '../CostCodeSelect'

interface Props {
  open: boolean
  onClose: () => void
  project: Project
  /** When set, the form edits this subcontract instead of creating a new one. */
  initial?: Subcontract
}

const STATUSES: SubcontractStatus[] = ['draft', 'awarded', 'complete', 'terminated']

/** Editable scope line — amounts/durations held as strings while typing. */
interface LineDraft {
  id: string
  ccId: string
  desc: string
  amount: number
  durationDays: string
}

function blankLine(ccId: string): LineDraft {
  return { id: newId('SL'), ccId, desc: '', amount: 0, durationDays: '' }
}

/**
 * Subcontract capture (4.8-E). Mirrors POForm, but a subcontract holds a sub's
 * WHOLE multi-stage scope: a repeatable scope-line editor where each line is
 * allocated to a BOQ cost code (via CostCodeSelect) with its own ex-GST value
 * and an optional working-day duration. The awarded total (Σ lines) reconciles
 * against the BOQ budget in the list view; it does not touch committed-to-date.
 */
export function SubcontractForm({ open, onClose, project, initial }: Props) {
  const state = useAppState()
  const dispatch = useDispatch()
  const confirm = useConfirm()
  const { toast } = useToast()
  const isEdit = !!initial
  const firstCode = (project.codes[0]?.id as string) ?? ''

  const blank = () => ({
    subId: '',
    ref: '',
    status: 'awarded' as SubcontractStatus,
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    scope: [blankLine(firstCode)],
  })

  const [form, setForm] = useState(() =>
    initial
      ? {
          subId: initial.subId as string,
          ref: initial.ref,
          status: initial.status,
          date: initial.date,
          notes: initial.notes ?? '',
          scope: initial.scope.map((l) => ({
            id: l.id as string,
            ccId: l.ccId as string,
            desc: l.desc,
            amount: l.amount,
            durationDays: l.durationDays != null ? String(l.durationDays) : '',
          })),
        }
      : blank(),
  )
  const [attempted, setAttempted] = useState(false)

  const subMissing = form.subId === ''
  const awardedTotal = form.scope.reduce((s, l) => s + parseAmount(l.amount), 0)

  function setLine(id: string, patch: Partial<LineDraft>) {
    setForm((f) => ({
      ...f,
      scope: f.scope.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }
  function addLine() {
    setForm((f) => ({ ...f, scope: [...f.scope, blankLine(firstCode)] }))
  }
  function removeLine(id: string) {
    setForm((f) => ({ ...f, scope: f.scope.filter((l) => l.id !== id) }))
  }

  function reset() {
    setForm(blank())
    setAttempted(false)
  }

  function buildScope() {
    return form.scope
      .filter((l) => l.ccId)
      .map((l) => {
        const dur = l.durationDays.trim()
        return {
          id: asId<ScopeLineId>(l.id),
          ccId: l.ccId as unknown as CostCodeId,
          desc: l.desc,
          amount: parseAmount(l.amount),
          ...(dur !== '' && Number(dur) > 0 ? { durationDays: Number(dur) } : {}),
        }
      })
  }

  function save() {
    if (subMissing) {
      setAttempted(true)
      return
    }
    const scope = buildScope()
    if (isEdit && initial) {
      dispatch({
        type: 'UPDATE_SUBCONTRACT',
        projectId: project.id,
        subcontractId: initial.id,
        patch: {
          subId: form.subId as unknown as SubcontractorId,
          ref: form.ref,
          status: form.status,
          date: form.date,
          notes: form.notes,
          scope,
        },
      })
      toast('Subcontract updated', 'success')
      onClose()
      return
    }
    const count = (state.subcontracts[project.id as string] ?? []).length
    const subcontract: Subcontract = {
      id: asId<SubcontractId>(newId('SC')),
      subId: form.subId as unknown as SubcontractorId,
      ref: form.ref.trim() || `SC-${String(count + 1).padStart(3, '0')}`,
      status: form.status,
      date: form.date,
      scope,
      notes: form.notes,
    }
    dispatch({ type: 'ADD_SUBCONTRACT', projectId: project.id, subcontract })
    toast('Subcontract created', 'success')
    reset()
    onClose()
  }

  async function remove() {
    if (!initial) return
    const ok = await confirm({
      title: 'Delete subcontract',
      message: `Delete subcontract ${initial.ref}? This can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    dispatch({ type: 'DELETE_SUBCONTRACT', projectId: project.id, subcontractId: initial.id })
    toast('Subcontract deleted', 'success')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={isEdit ? 'Edit Subcontract' : 'New Subcontract'}
      widthClass="max-w-2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          {isEdit ? (
            <button
              type="button"
              onClick={remove}
              className="cursor-pointer bg-transparent text-[12px] text-sw-dim hover:text-sw-danger"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <Button onClick={save}>{isEdit ? 'Save Changes' : 'Save Subcontract'}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Subcontractor"
          error={attempted && subMissing ? 'Subcontractor required' : undefined}
        >
          <Select
            value={form.subId}
            onChange={(e) => setForm({ ...form, subId: e.target.value })}
            invalid={attempted && subMissing}
          >
            <option value="">— Select subcontractor —</option>
            {state.subs.map((s) => (
              <option key={s.id as string} value={s.id as string}>
                {s.name}
                {s.trade ? ` · ${s.trade}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Agreement Ref">
          <Input
            value={form.ref}
            onChange={(e) => setForm({ ...form, ref: e.target.value })}
            placeholder="Auto (SC-00N) if blank"
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SubcontractStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0]!.toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Agreement Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </Field>
      </div>

      {/* Scope lines */}
      <div className="mt-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sw-dim">
            Scope of works — allocate each stage to a cost code
          </span>
          <button
            type="button"
            onClick={addLine}
            className="cursor-pointer rounded-[1px] border border-sw-rule bg-transparent px-2 py-[3px] text-[11px] text-sw-dim hover:text-sw-ink"
          >
            + Add stage
          </button>
        </div>
        <div className="space-y-2">
          {form.scope.map((l) => (
            <div key={l.id} className="grid grid-cols-[1fr_1fr_110px_84px_28px] items-center gap-2">
              <CostCodeSelect
                projectId={project.id}
                codes={project.codes}
                value={l.ccId}
                onChange={(cc) => setLine(l.id, { ccId: cc })}
              />
              <Input
                value={l.desc}
                onChange={(e) => setLine(l.id, { desc: e.target.value })}
                placeholder="Stage description"
              />
              <Input
                type="number"
                step="0.01"
                value={l.amount}
                onChange={(e) => setLine(l.id, { amount: parseAmount(e.target.value) })}
                placeholder="Amount"
              />
              <Input
                type="number"
                step="1"
                value={l.durationDays}
                onChange={(e) => setLine(l.id, { durationDays: e.target.value })}
                placeholder="Days"
                aria-label="Duration in working days"
              />
              <button
                type="button"
                onClick={() => removeLine(l.id)}
                disabled={form.scope.length === 1}
                aria-label="Remove stage"
                className="cursor-pointer bg-transparent text-[16px] leading-none text-sw-faint hover:text-sw-danger disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <Field label="Notes">
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
        />
      </Field>

      {awardedTotal > 0 && (
        <div className="flex gap-8 rounded-[1px] bg-sw-bg px-3.5 py-2.5 text-[12px] text-sw-dim">
          <span>
            Awarded (ex GST):{' '}
            <strong className="font-mono text-sw-ink">{formatCurrency(awardedTotal)}</strong>
          </span>
          <span>
            GST:{' '}
            <strong className="font-mono text-sw-ink">{formatCurrency(gstOf(awardedTotal))}</strong>
          </span>
          <span>
            Total:{' '}
            <strong className="font-mono text-sw-ink">
              {formatCurrency(incGst(awardedTotal))}
            </strong>
          </span>
        </div>
      )}
    </Dialog>
  )
}
