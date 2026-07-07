import { useState } from 'react'
import { Button, Dialog, EmptyState, Field, Input } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { ProjectId, Selection, SelectionId } from '@/types'
import { newId } from '@/lib/newId'

interface FormProps {
  open: boolean
  onClose: () => void
  projectId: ProjectId
}

function SelectionForm({ open, onClose, projectId }: FormProps) {
  const dispatch = useDispatch()
  const [form, setForm] = useState<Omit<Selection, 'id'>>({
    category: '',
    item: '',
    options: '',
    notes: '',
    status: 'pending',
    approvedOption: null,
    amount: 0,
  })
  const [attempted, setAttempted] = useState(false)
  const itemMissing = form.item.trim() === ''

  function save() {
    if (itemMissing) {
      setAttempted(true)
      return
    }
    const id = asId<SelectionId>(newId('SEL'))
    dispatch({ type: 'ADD_SELECTION', projectId, selection: { id, ...form } })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New client selection"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Kitchen"
          />
        </Field>
        <Field label="Item" required error={attempted && itemMissing ? 'Required' : undefined}>
          <Input
            value={form.item}
            onChange={(e) => setForm({ ...form, item: e.target.value })}
            invalid={attempted && itemMissing}
            placeholder="e.g. Benchtop"
          />
        </Field>
      </div>
      <Field label="Options offered">
        <Input
          value={form.options}
          onChange={(e) => setForm({ ...form, options: e.target.value })}
          placeholder="Caesarstone Calacatta Nuvo / Engineered stone Bianco Drift"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Allowance ($)">
          <Input
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
          />
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
    </Dialog>
  )
}

export function SelectionsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [creating, setCreating] = useState(false)

  if (!project) return null
  const selections = state.selections[project.id as string] ?? []

  function approve(sel: Selection) {
    if (!project) return
    const choice = window.prompt(`Approve "${sel.item}" — which option?`, sel.options.split('/')[0])
    if (!choice) return
    dispatch({
      type: 'APPROVE_SELECTION',
      projectId: project.id,
      selectionId: sel.id,
      approvedOption: choice.trim(),
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">Client Selections</h2>
        <Button onClick={() => setCreating(true)}>+ New Selection</Button>
      </header>

      {selections.length === 0 ? (
        <EmptyState
          title="No selections yet"
          description="Track finishes / fixtures the client is choosing from."
          action={<Button onClick={() => setCreating(true)}>+ New Selection</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Item</th>
                <th>Options / Approved</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {selections.map((s) => (
                <tr key={s.id} className="border-b border-sw-border last:border-0">
                  <td className="text-sw-muted">{s.category}</td>
                  <td>{s.item}</td>
                  <td className="text-xs text-sw-muted">
                    {s.approvedOption ? (
                      <span className="text-sw-text">✓ {s.approvedOption}</span>
                    ) : (
                      s.options
                    )}
                  </td>
                  <td className="text-right font-mono">{formatCurrency(s.amount)}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="text-right">
                    {s.status === 'pending' && (
                      <Button size="sm" variant="secondary" onClick={() => approve(s)}>
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SelectionForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
    </div>
  )
}
