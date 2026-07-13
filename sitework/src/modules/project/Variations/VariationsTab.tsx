import { useMemo, useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { VariationForm } from './VariationForm'
import type { CostCodeId, Variation } from '@/types'

/**
 * Variations — transliteration of legacy `B1` (R6, PARITY gap 4): 26px
 * header with "N variations · X approved · Y pending" sub-line (pending
 * violet when > 0), columns ID / Description / **Requested By** / Cost
 * Code ("001 — desc") / Amount / Status / Date, row-click edit. The port's
 * raw-enum Reason column is gone (legacy shows the reason in the form only).
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
    if (project) for (const c of project.codes) m.set(c.id as string, `${c.code} — ${c.desc}`)
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
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Variations</h2>
          <div className="text-[13px] text-sw-dim">
            {variations.length} variations · {formatCurrency(approvedTotal)} approved ·{' '}
            <span style={{ color: pendingTotal > 0 ? 'var(--sw-violet)' : 'var(--sw-dim)' }}>
              {formatCurrency(pendingTotal)} pending
            </span>
          </div>
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
        <div className="border-t border-sw-ink bg-white">
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Requested By</th>
                <th>Cost Code</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {variations.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setEditing(v)}
                  className="cursor-pointer border-b border-sw-rule-l"
                >
                  <td className="font-mono text-sw-dim">{v.id}</td>
                  <td className="font-medium">{v.desc}</td>
                  <td className="text-sw-dim">{v.requestedBy || '—'}</td>
                  <td className="text-sw-dim">{codeLookup(v.ccId)}</td>
                  <td className="text-right font-mono font-semibold">{formatCurrency(v.amount)}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="text-sw-dim">{formatDate(v.date)}</td>
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
        nextNum={variations.length + 1}
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
