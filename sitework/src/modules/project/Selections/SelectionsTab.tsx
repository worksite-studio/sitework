import { useState } from 'react'
import { Button, Card, Dialog, EmptyState, Field, Input } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { asId } from '@/types'
import type { ProjectId, Selection, SelectionId } from '@/types'

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
    const id = asId<SelectionId>(`SEL-${Date.now()}`)
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
        <h2 className="text-lg font-semibold">Client Selections</h2>
        <Button onClick={() => setCreating(true)}>+ New Selection</Button>
      </header>

      {selections.length === 0 ? (
        <EmptyState
          title="No selections yet"
          description="Track finishes / fixtures the client is choosing from."
          action={<Button onClick={() => setCreating(true)}>+ New Selection</Button>}
        />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-sw-muted text-left border-b border-sw-border">
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Options / Approved</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {selections.map((s) => (
                <tr key={s.id} className="border-b border-sw-border last:border-0">
                  <td className="px-3 py-2 text-sw-muted">{s.category}</td>
                  <td className="px-3 py-2">{s.item}</td>
                  <td className="px-3 py-2 text-xs text-sw-muted">
                    {s.approvedOption ? (
                      <span className="text-sw-text">✓ {s.approvedOption}</span>
                    ) : (
                      s.options
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(s.amount)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
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
        </Card>
      )}

      <SelectionForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
    </div>
  )
}
