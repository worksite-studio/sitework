import { useAppState, useDispatch } from '@/state/context'
import { EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { useProject } from '../useProject'
import type {
  PrimeCostItem,
  PrimeCostItemId,
  ProjectId,
  ProvisionalSum,
  ProvisionalSumId,
} from '@/types'

interface ReconciledRow {
  id: string
  description: string
  allowance: number
  actualCost: number
  variance: number
  /** Margin applies to the excess only, per CONTRACTS_REFERENCE.md §7.4. */
  marginOnExcess: number
  /** allowance + variance + marginOnExcess. */
  netToClaim: number
  status: string
}

function reconcile(allowance: number, actualCost: number, marginRate: number) {
  const variance = actualCost - allowance
  const marginOnExcess = variance > 0 ? variance * marginRate : 0
  const netToClaim = allowance + Math.max(variance, 0) + marginOnExcess
  return { variance, marginOnExcess, netToClaim }
}

/**
 * PC & PS tab — port of legacy `Pcps`. Two tables (Prime Cost items +
 * Provisional Sums) with the reconciliation columns added in Phase 1.5
 * item 1. Margin applies to the excess only (CONTRACTS_REFERENCE §7.4).
 *
 * Read-only for now — the legacy `pcf`/`psf` add/edit forms aren't ported
 * yet; that polish lands in a follow-up session. The tab is still useful
 * because seed has rows and the math wires up.
 */
export function PcPsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  if (!project) return null

  const pcRows: PrimeCostItem[] = state.primeCostItems[project.id as string] ?? []
  const psRows: ProvisionalSum[] = state.provisionalSums[project.id as string] ?? []

  const pcReconciled: ReconciledRow[] = pcRows.map((r) => ({
    id: r.id as string,
    description: r.description,
    allowance: r.allowance,
    actualCost: r.actualCost,
    status: r.status,
    ...reconcile(r.allowance, r.actualCost, r.marginRate),
  }))
  const psReconciled: ReconciledRow[] = psRows.map((r) => ({
    id: r.id as string,
    description: r.description,
    allowance: r.allowance,
    actualCost: r.actualCost,
    status: r.status,
    ...reconcile(r.allowance, r.actualCost, r.marginRate),
  }))

  function quickDelete(kind: 'pc' | 'ps', id: string) {
    const ok = window.confirm('Remove this allowance? It will be cleared from this project.')
    if (!ok || !project) return
    if (kind === 'pc') {
      dispatch({
        type: 'DELETE_PC_ITEM',
        projectId: project.id as ProjectId,
        itemId: id as unknown as PrimeCostItemId,
      })
    } else {
      dispatch({
        type: 'DELETE_PS_ITEM',
        projectId: project.id as ProjectId,
        itemId: id as unknown as ProvisionalSumId,
      })
    }
  }

  return (
    <div className="space-y-6">
      <Section
        title="Prime Cost items"
        empty="No PC items yet. PC items track allowance vs reconciled cost; margin applies to the excess only."
        rows={pcReconciled}
        onDelete={(id) => quickDelete('pc', id)}
      />
      <Section
        title="Provisional Sums"
        empty="No PS items yet. PS items track allowance vs reconciled cost; margin applies to the excess only."
        rows={psReconciled}
        onDelete={(id) => quickDelete('ps', id)}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  empty: string
  rows: ReconciledRow[]
  onDelete: (id: string) => void
}

function Section({ title, empty, rows, onDelete }: SectionProps) {
  if (rows.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="text-[12px] font-semibold text-sw-ink">{title}</h2>
        <EmptyState title={title} description={empty} />
      </section>
    )
  }

  const totals = rows.reduce(
    (acc, r) => ({
      allowance: acc.allowance + r.allowance,
      actualCost: acc.actualCost + r.actualCost,
      marginOnExcess: acc.marginOnExcess + r.marginOnExcess,
      netToClaim: acc.netToClaim + r.netToClaim,
    }),
    { allowance: 0, actualCost: 0, marginOnExcess: 0, netToClaim: 0 },
  )

  return (
    <section className="space-y-2">
      <h2 className="text-[12px] font-semibold text-sw-ink">{title}</h2>
      <div>
        <table className="sw-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right">Allowance</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Variance</th>
              <th className="text-right">Margin on excess</th>
              <th className="text-right">Net to claim</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-sw-border last:border-0">
                <td>{r.description}</td>
                <td className="text-right font-mono">{formatCurrency(r.allowance)}</td>
                <td className="text-right font-mono">{formatCurrency(r.actualCost)}</td>
                <td
                  className={`px-3 py-2 text-right font-mono ${
                    r.variance > 0
                      ? 'text-sw-danger'
                      : r.variance < 0
                        ? 'text-sw-success'
                        : 'text-sw-muted'
                  }`}
                >
                  {r.variance === 0 ? '—' : formatCurrency(r.variance)}
                </td>
                <td className="text-right font-mono">
                  {r.marginOnExcess > 0 ? formatCurrency(r.marginOnExcess) : '—'}
                </td>
                <td className="text-right font-mono font-medium">{formatCurrency(r.netToClaim)}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    aria-label={`Remove ${r.description}`}
                    className="text-sw-muted hover:text-sw-danger transition px-2"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            <tr className="bg-sw-muted/5 font-medium text-sm">
              <td className="text-sw-muted text-xs uppercase">Totals</td>
              <td className="text-right font-mono">{formatCurrency(totals.allowance)}</td>
              <td className="text-right font-mono">{formatCurrency(totals.actualCost)}</td>
              <td />
              <td className="text-right font-mono">{formatCurrency(totals.marginOnExcess)}</td>
              <td className="text-right font-mono">{formatCurrency(totals.netToClaim)}</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
