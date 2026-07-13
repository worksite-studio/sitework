import { useState } from 'react'
import { Button, Dialog, Field, Input, Select as UiSelect } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { Selection, SelectionId } from '@/types'
import { newId } from '@/lib/newId'

/**
 * Client Selections — transliteration of legacy `N1` + `T1` (R7, PARITY
 * gap-12 row): "N items · N awaiting decision" sub-line (awaiting = open),
 * ruled list panels (uppercase category · bold item · status right, options
 * line, green "Approved: X", faint "Note: X", "Approve selection" link on
 * anything not approved), "+ Add Selection" (`T1`), and the Approve
 * Selection option-picker dialog (APPROVE_SELECTION).
 */
export function SelectionsTab() {
  const project = useProject()
  const state = useAppState()
  const [modal, setModal] = useState<'new' | { approve: Selection } | null>(null)
  if (!project) return null

  const selections: Selection[] = state.selections[project.id as string] ?? []
  const awaiting = selections.filter((s) => s.status === 'open').length

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Client Selections
          </h2>
          <div className="text-[13px] text-sw-dim">
            {selections.length} items · {awaiting} awaiting decision
          </div>
        </div>
        <Button onClick={() => setModal('new')}>+ Add Selection</Button>
      </header>

      <div className="flex flex-col gap-2.5">
        {selections.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-sw-faint">
            No client selections yet.
          </div>
        ) : (
          selections.map((sel) => (
            <div key={sel.id as string} className="border-b border-sw-rule bg-white py-[18px]">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="mr-2.5 text-[9px] uppercase tracking-[0.08em] text-sw-dim">
                    {sel.category}
                  </span>
                  <span className="text-[14px] font-bold text-sw-ink">{sel.item}</span>
                </div>
                <StatusBadge status={sel.status} />
              </div>
              <div
                className="text-[12px] text-sw-dim"
                style={{ marginBottom: sel.approvedOption ? 6 : 0 }}
              >
                {sel.options}
              </div>
              {sel.approvedOption && (
                <div className="text-[12px] font-semibold" style={{ color: 'var(--sw-pos)' }}>
                  Approved: {sel.approvedOption}
                </div>
              )}
              {sel.notes && <div className="mt-1 text-[11px] text-sw-faint">Note: {sel.notes}</div>}
              {sel.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => setModal({ approve: sel })}
                  className="mt-2 cursor-pointer bg-transparent p-0 text-[11px] font-medium text-sw-ink hover:underline"
                >
                  Approve selection
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {modal === 'new' && <SelectionForm onClose={() => setModal(null)} />}
      {modal !== null && modal !== 'new' && (
        <ApproveDialog selection={modal.approve} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

/** Legacy `T1` — item required; new selections start 'open'. (Legacy labels
 *  the category field "Cost Code" with an "e.g. Kitchen" placeholder — kept
 *  verbatim, quirk and all.) */
function SelectionForm({ onClose }: { onClose: () => void }) {
  const project = useProject()
  const dispatch = useDispatch()
  const [form, setForm] = useState({ category: '', item: '', options: '', notes: '' })
  const [attempted, setAttempted] = useState(false)
  if (!project) return null

  function save() {
    if (!project) return
    if (!form.item.trim()) {
      setAttempted(true)
      return
    }
    const selection: Selection = {
      id: asId<SelectionId>(newId('SEL')),
      ...form,
      status: 'open',
      approvedOption: null,
      amount: 0,
    }
    dispatch({ type: 'ADD_SELECTION', projectId: project.id, selection })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Add Selection Item"
      footer={<Button onClick={save}>Add Selection</Button>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost Code">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Kitchen"
          />
        </Field>
        <Field
          label="Item"
          required
          error={attempted && !form.item.trim() ? 'Required' : undefined}
        >
          <Input
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            invalid={attempted && !form.item.trim()}
            placeholder="e.g. Benchtop"
          />
        </Field>
      </div>
      <Field label="Options">
        <Input
          value={form.options}
          onChange={(e) => setForm({ ...form, options: e.target.value })}
          placeholder="Option A / Option B / Option C"
        />
      </Field>
      <Field label="Notes">
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </Dialog>
  )
}

/** Legacy N1 approve dialog — pick from the "/"-separated options. */
function ApproveDialog({ selection, onClose }: { selection: Selection; onClose: () => void }) {
  const project = useProject()
  const dispatch = useDispatch()
  const [approved, setApproved] = useState('')
  if (!project) return null

  function confirm() {
    if (!project) return
    dispatch({
      type: 'APPROVE_SELECTION',
      projectId: project.id,
      selectionId: selection.id,
      approvedOption: approved,
    })
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Approve Selection"
      footer={<Button onClick={confirm}>Confirm Approval</Button>}
    >
      <div className="mb-4">
        <div className="mb-1 text-[14px] font-bold text-sw-ink">{selection.item}</div>
        <div className="text-[12px] text-sw-dim">{selection.options}</div>
      </div>
      <Field label="Approved option">
        <UiSelect value={approved} onChange={(e) => setApproved(e.target.value)}>
          <option value="">Select approved option...</option>
          {selection.options.split('/').map((o) => (
            <option key={o.trim()} value={o.trim()}>
              {o.trim()}
            </option>
          ))}
        </UiSelect>
      </Field>
    </Dialog>
  )
}
