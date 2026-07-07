import { useMemo, useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { VariationForm } from './VariationForm'
import type { CostCodeId, Variation } from '@/types'

/**
 * Variations tab — port of legacy `B1`. Variation list with row-click edit,
 * approved-amount running tally, and reason-category visibility.
 *
 * Approved variations roll into the project's adjusted contract value on
 * the Overview tab via computeProjectFinancials().
 */
export function VariationsTab() {
  const project = useProject()
  const [editing, setEditing] = useState<Variation | null>(null)
  const [creating, setCreating] = useState(false)

  const codes = useMemo(
    () => (project ? project.codes.map((c) => ({ id: c.id, code: c.code, desc: c.desc })) : []),
    [project],
  )
  const codeLookup = useMemo(() => {
    const m = new Map<string, string>()
    if (project) for (const c of project.codes) m.set(c.id as string, `${c.code} · ${c.desc}`)
    return (id: CostCodeId) => m.get(id as string) ?? '—'
  }, [project])

  if (!project) return null

  const variations = project.variations
  const approvedTotal = variations
    .filter((v) => v.status === 'Approved')
    .reduce((s, v) => s + (v.amount || 0), 0)
  const pendingTotal = variations
    .filter((v) => v.status === 'Pending')
    .reduce((s, v) => s + (v.amount || 0), 0)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Variations</h2>
          <p className="text-xs text-sw-muted">
            Approved:{' '}
            <span className="text-sw-text font-medium">{formatCurrency(approvedTotal)}</span> ·
            Pending: {formatCurrency(pendingTotal)}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={codes.length === 0}>
          + New Variation
        </Button>
      </header>

      {codes.length === 0 ? (
        <EmptyState
          title="No cost codes yet"
          description="Add a cost code on the BOQ tab before raising variations."
        />
      ) : variations.length === 0 ? (
        <EmptyState
          title="No variations yet"
          description="Track scope changes here so they roll into the adjusted contract value cleanly."
          action={<Button onClick={() => setCreating(true)}>+ New Variation</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Code</th>
                <th>Reason</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setEditing(v)}
                  className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                >
                  <td className="text-sw-muted font-mono">{v.id}</td>
                  <td>{v.desc}</td>
                  <td className="text-xs text-sw-muted">{codeLookup(v.ccId)}</td>
                  <td className="text-xs text-sw-muted">{v.reasonCategory}</td>
                  <td className="text-right font-mono">{formatCurrency(v.amount)}</td>
                  <td className="text-sw-muted">{formatDate(v.date)}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VariationForm
        open={creating}
        onClose={() => setCreating(false)}
        projectId={project.id}
        codes={codes}
      />
      {editing && (
        <VariationForm
          open
          onClose={() => setEditing(null)}
          projectId={project.id}
          codes={codes}
          initial={editing}
        />
      )}
    </div>
  )
}
