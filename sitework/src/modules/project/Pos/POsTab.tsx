import { useMemo, useState } from 'react'
import { Button, Card, EmptyState } from '@/components/ui'
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
          <h2 className="text-lg font-semibold">Purchase Orders</h2>
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
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-sw-muted text-left border-b border-sw-border">
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Supplier</th>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium" aria-label="Receive" />
              </tr>
            </thead>
            <tbody>
              {purchases.map((po) => (
                <tr key={po.id} className="border-b border-sw-border last:border-0">
                  <td className="px-3 py-2 text-sw-muted tabular-nums">{po.id}</td>
                  <td className="px-3 py-2">{po.supplier}</td>
                  <td className="px-3 py-2 text-sw-muted">{codeLookup(po.ccId)}</td>
                  <td className="px-3 py-2">{po.desc}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(po.amount)}</td>
                  <td className="px-3 py-2 text-sw-muted">{formatDate(po.date)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="px-3 py-2 text-right">
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
        </Card>
      )}

      <POForm open={creating} onClose={() => setCreating(false)} project={project} />
    </div>
  )
}
