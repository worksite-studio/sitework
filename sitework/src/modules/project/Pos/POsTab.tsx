import { useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { POForm } from './POForm'
import type { Purchase } from '@/types'

/**
 * Purchase Orders — transliteration of legacy `M1v2` (R2, PARITY gap 12):
 * header stat line (received of committed), full column set (PO #, Doc Ref,
 * description, cost code + description, GST, Total inc GST), zebra rows,
 * totals footer, and the inline RECEIVE action on any PO that isn't
 * received/cancelled. Date column is port-additive (PARITY gap-12 "keep").
 */
export function POsTab() {
  const project = useProject()
  const state = useAppState()
  const dispatch = useDispatch()
  const [creating, setCreating] = useState(false)

  if (!project) return null

  const purchases: Purchase[] = state.purchases[project.id as string] ?? []
  const total = purchases.reduce((s, p) => s + (p.amount || 0), 0)
  const received = purchases
    .filter((p) => p.status === 'received')
    .reduce((s, p) => s + (p.amount || 0), 0)

  function supplierName(po: Purchase): string {
    const sub = po.subId ? state.subs.find((s) => (s.id as string) === po.subId) : null
    return sub?.name || po.supplier || '—'
  }
  function codeText(po: Purchase): string {
    const cc = project?.codes.find((c) => c.id === po.ccId)
    return cc ? `${cc.code} ${cc.desc}` : '—'
  }

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
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Purchase Orders
          </h2>
          <div className="text-[13px] text-sw-dim">
            {formatCurrency(received)} received of {formatCurrency(total)} committed
          </div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
          + Create PO
        </Button>
      </header>

      {purchases.length === 0 ? (
        <EmptyState
          title="No purchase orders yet"
          description="Raise POs against the project's cost codes to track committed spend."
          action={
            <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
              + Create PO
            </Button>
          }
        />
      ) : (
        <div className="border-t border-sw-ink">
          <table className="sw-table">
            <thead>
              <tr>
                <th>PO #</th>
                <th>Supplier / Subcontractor</th>
                <th>Doc Ref</th>
                <th>Description</th>
                <th>Cost Code</th>
                <th className="text-right">Amount (ex GST)</th>
                <th className="text-right">GST</th>
                <th className="text-right">Total inc GST</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((po, idx) => (
                <tr key={po.id} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}>
                  <td className="font-mono text-sw-dim">{po.poNum || po.id}</td>
                  <td className="font-medium">{supplierName(po)}</td>
                  <td className="font-mono text-sw-dim">{po.docRef || '—'}</td>
                  <td className="text-sw-dim">{po.desc || '—'}</td>
                  <td className="text-sw-dim">{codeText(po)}</td>
                  <td className="text-right font-mono font-semibold">
                    {formatCurrency(po.amount)}
                  </td>
                  <td className="text-right font-mono text-sw-dim">
                    {formatCurrency(po.amount * 0.1)}
                  </td>
                  <td className="text-right font-mono font-semibold">
                    {formatCurrency(po.amount * 1.1)}
                  </td>
                  <td className="text-sw-dim">{formatDate(po.date)}</td>
                  <td className="whitespace-nowrap">
                    <StatusBadge status={po.status} />
                    {po.status !== 'received' && po.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => receivePO(po)}
                        className="ml-2 cursor-pointer border border-sw-rule rounded-[1px] bg-transparent px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] text-sw-dim hover:text-sw-ink"
                      >
                        Receive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between border-t border-sw-rule bg-sw-bg px-4 py-3">
            <span className="text-[12px] text-sw-dim">
              {purchases.length} PO{purchases.length !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-[13px] font-semibold">
              Total inc GST: {formatCurrency(total * 1.1)}
            </span>
          </div>
        </div>
      )}

      <POForm open={creating} onClose={() => setCreating(false)} project={project} />
    </div>
  )
}
