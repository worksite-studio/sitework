import { useMemo, useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { POForm } from './POForm'
import type { CostCodeId, Purchase } from '@/types'

/**
 * Purchase Orders tab — port of legacy M1v2. Receive button on sent POs
 * dispatches RECEIVE_PURCHASE; matches the legacy session-13 wiring.
 */
export function POsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [creating, setCreating] = useState(false)

  const codeLookup = useMemo(() => {
    const m = new Map<string, string>()
    if (project) for (const c of project.codes) m.set(c.id as string, c.code)
    return (id: CostCodeId) => m.get(id as string) ?? '—'
  }, [project])

  if (!project) return null

  const purchases: Purchase[] = state.purchases[project.id as string] ?? []
  const committed = purchases.reduce((s, p) => s + (p.amount || 0), 0)
  const received = purchases
    .filter((p) => p.status === 'received')
    .reduce((s, p) => s + (p.amount || 0), 0)

  function receivePO(po: Purchase) {
    if (!project) return
    dispatch({
      type: 'RECEIVE_PURCHASE',
      projectId: project.id,
      purchaseId: po.id,
      receivedDate: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Purchase Orders</h2>
          <p className="text-xs text-sw-muted">
            {formatCurrency(received)} received <span className="text-sw-muted">of</span>{' '}
            <span className="text-sw-text font-medium">{formatCurrency(committed)}</span> committed
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
          + New PO
        </Button>
      </header>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Raise POs against the project's cost codes to track committed spend."
          action={
            <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
              + New PO
            </Button>
          }
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Code</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th aria-label="Receive" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((po) => (
                <tr key={po.id} className="border-b border-sw-border last:border-0">
                  <td className="text-sw-muted font-mono">{po.id}</td>
                  <td>{po.supplier}</td>
                  <td className="text-sw-muted">{codeLookup(po.ccId)}</td>
                  <td>{po.desc}</td>
                  <td className="text-right font-mono">{formatCurrency(po.amount)}</td>
                  <td className="text-sw-muted">{formatDate(po.date)}</td>
                  <td>
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="text-right">
                    {po.status === 'sent' && (
                      <Button size="sm" variant="secondary" onClick={() => receivePO(po)}>
                        Receive
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <POForm open={creating} onClose={() => setCreating(false)} project={project} />
    </div>
  )
}
