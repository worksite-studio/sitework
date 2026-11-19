import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, EmptyState, EntityLink, FilterBanner } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { gstOf, incGst } from '@/lib/money'
import { useTableSort } from '@/lib/useTableSort'
import { useAppState, useDispatch } from '@/state/context'
import { useProject } from '../useProject'
import { reconcileSubcontracts } from '../computeFinancials'
import { POForm } from './POForm'
import { SubcontractForm } from './SubcontractForm'
import type { Purchase, Subcontract } from '@/types'

type POSortKey = 'poNum' | 'supplier' | 'code' | 'amount' | 'date' | 'status'

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
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [creatingSub, setCreatingSub] = useState(false)
  const [editingSub, setEditingSub] = useState<Subcontract | null>(null)
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // Drill-through filters (Phase 4.5-C): ?cc from a BOQ code, ?sup from a
  // supplier cell. Render-time only — the filter lives in the URL.
  const ccFilter = searchParams.get('cc')
  const supFilter = searchParams.get('sup')

  const supplierName = (po: Purchase): string => {
    const sub = po.subId ? state.subs.find((s) => (s.id as string) === po.subId) : null
    return sub?.name || po.supplier || '—'
  }
  const codeText = (po: Purchase): string => {
    const cc = project?.codes.find((c) => c.id === po.ccId)
    return cc ? `${cc.code} ${cc.desc}` : '—'
  }

  const purchases: Purchase[] = project ? (state.purchases[project.id as string] ?? []) : []
  const total = purchases.reduce((s, p) => s + (p.amount || 0), 0)
  const received = purchases
    .filter((p) => p.status === 'received')
    .reduce((s, p) => s + (p.amount || 0), 0)

  let filtered = purchases
  if (ccFilter) filtered = filtered.filter((p) => (p.ccId as string) === ccFilter)
  if (supFilter) filtered = filtered.filter((p) => supplierName(p) === supFilter)
  const q = search.trim().toLowerCase()
  if (q)
    filtered = filtered.filter(
      (p) =>
        supplierName(p).toLowerCase().includes(q) ||
        (p.poNum ?? '').toLowerCase().includes(q) ||
        (p.docRef ?? '').toLowerCase().includes(q) ||
        codeText(p).toLowerCase().includes(q),
    )

  // Sortable columns (Phase 4.5-E).
  const { sorted, toggle, indicator, ariaSort } = useTableSort<Purchase, POSortKey>(filtered, {
    poNum: (p) => p.poNum || (p.id as string),
    supplier: supplierName,
    code: codeText,
    amount: (p) => p.amount || 0,
    date: (p) => p.date,
    status: (p) => p.status,
  })

  if (!project) return null

  const clearParam = (key: string) => {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    setSearchParams(next, { replace: true })
  }
  const paramSearch = (key: string, val: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, val)
    return { search: `?${next.toString()}` }
  }
  const ccFilterCode = ccFilter ? project.codes.find((c) => (c.id as string) === ccFilter) : null
  // Footer total reflects the rows currently shown; equals `total` unfiltered.
  const shownTotal = filtered.reduce((s, p) => s + (p.amount || 0), 0)

  // ── Subcontracts (4.8-E) ──────────────────────────────────────────────────
  const subcontracts = state.subcontracts[project.id as string] ?? []
  const subName = (sc: Subcontract): string =>
    state.subs.find((s) => (s.id as string) === (sc.subId as string))?.name ?? '—'
  const scTotal = (sc: Subcontract): number => sc.scope.reduce((s, l) => s + (l.amount || 0), 0)
  const recon = reconcileSubcontracts(subcontracts, project.codes)

  const sortTh = (label: string, key: POSortKey, className = '') => (
    <th
      className={`cursor-pointer select-none hover:text-sw-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-sw-ink ${className}`}
      aria-sort={ariaSort(key)}
      tabIndex={0}
      onClick={() => toggle(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle(key)
        }
      }}
    >
      {label}
      {indicator(key)}
    </th>
  )

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
            Purchase Orders &amp; Subcontracts
          </h2>
          <div className="text-[13px] text-sw-dim">
            {formatCurrency(received)} received of {formatCurrency(total)} committed
          </div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
          + Create PO
        </Button>
      </header>

      {purchases.length > 0 && (
        <div className="mb-5 flex">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO # / supplier / ref / code…"
            aria-label="Search purchase orders"
            className="ml-auto w-[260px] border-b border-sw-rule bg-transparent px-1 py-[5px] text-[12px] text-sw-ink focus:border-sw-ink focus:outline-none"
          />
        </div>
      )}

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
        <div>
          {ccFilter && (
            <FilterBanner
              label="cost code"
              value={ccFilterCode ? `${ccFilterCode.code} ${ccFilterCode.desc}` : ccFilter}
              onClear={() => clearParam('cc')}
            />
          )}
          {supFilter && (
            <FilterBanner label="supplier" value={supFilter} onClear={() => clearParam('sup')} />
          )}
          <div className="border-t border-sw-ink">
            <table className="sw-table">
              <thead>
                <tr>
                  {sortTh('Date', 'date')}
                  {sortTh('PO #', 'poNum')}
                  {sortTh('Supplier / Subcontractor', 'supplier')}
                  <th>Doc Ref</th>
                  <th>Description</th>
                  {sortTh('Cost Code', 'code')}
                  {sortTh('Amount (ex GST)', 'amount', 'text-right')}
                  <th className="text-right">GST</th>
                  <th className="text-right">Total inc GST</th>
                  {sortTh('Status', 'status')}
                </tr>
              </thead>
              <tbody>
                {sorted.map((po, idx) => (
                  <tr
                    key={po.id}
                    onClick={() => setEditing(po)}
                    className="cursor-pointer"
                    style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}
                  >
                    <td className="text-sw-dim">{formatDate(po.date)}</td>
                    <td className="font-mono text-sw-dim">{po.poNum || po.id}</td>
                    <td className="font-medium">
                      <EntityLink
                        to={paramSearch('sup', supplierName(po))}
                        stopPropagation
                        className="font-medium text-sw-ink"
                      >
                        {supplierName(po)}
                      </EntityLink>
                    </td>
                    <td className="font-mono text-sw-dim">{po.docRef || '—'}</td>
                    <td className="text-sw-dim">{po.desc || '—'}</td>
                    <td className="text-sw-dim">{codeText(po)}</td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(po.amount)}
                    </td>
                    <td className="text-right font-mono text-sw-dim">
                      {formatCurrency(gstOf(po.amount))}
                    </td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(incGst(po.amount))}
                    </td>
                    <td className="whitespace-nowrap">
                      <StatusBadge status={po.status} />
                      {po.status !== 'received' && po.status !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            receivePO(po)
                          }}
                          className="ml-2 cursor-pointer border border-sw-rule rounded-[1px] bg-transparent px-2 py-[3px] text-[10px] font-semibold uppercase tracking-[0.06em] text-sw-dim hover:text-sw-ink"
                        >
                          Receive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-[13px] text-sw-faint">
                      No purchase orders match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex justify-between border-t border-sw-rule bg-sw-bg px-4 py-3">
              <span className="text-[12px] text-sw-dim">
                {filtered.length} PO{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="font-mono text-[13px] font-semibold">
                Total inc GST: {formatCurrency(incGst(shownTotal))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Subcontracts ─────────────────────────────────────────────────── */}
      <section aria-label="Subcontracts" className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold tracking-[-0.01em] text-sw-ink">Subcontracts</h3>
            <div className="text-[13px] text-sw-dim">
              A trade&apos;s whole multi-stage scope, allocated to cost codes — awarded commitments
              reconciled against the BOQ.
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreatingSub(true)}
            disabled={project.codes.length === 0}
          >
            + Add Subcontract
          </Button>
        </div>

        {subcontracts.length === 0 ? (
          <EmptyState
            title="No subcontracts yet"
            description="Capture a subcontractor's whole scope across stages and allocate each to a cost code."
          />
        ) : (
          <>
            <div className="border-t border-sw-ink">
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Subcontractor</th>
                    <th>Stages</th>
                    <th className="text-right">Awarded (ex GST)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subcontracts.map((sc, idx) => (
                    <tr
                      key={sc.id as string}
                      onClick={() => setEditingSub(sc)}
                      className="cursor-pointer"
                      style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}
                    >
                      <td className="font-mono text-sw-dim">{sc.ref}</td>
                      <td className="font-medium text-sw-ink">{subName(sc)}</td>
                      <td className="text-sw-dim">
                        {sc.scope.length} stage{sc.scope.length !== 1 ? 's' : ''}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        {formatCurrency(scTotal(sc))}
                      </td>
                      <td>
                        <StatusBadge status={sc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Reconciliation vs BOQ budget */}
            <div className="mt-6">
              <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
                Awarded vs BOQ budget
              </div>
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Cost Code</th>
                    <th className="text-right">Awarded</th>
                    <th className="text-right">BOQ Budget</th>
                    <th className="text-right">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {recon.byCode.map((r) => (
                    <tr key={r.ccId}>
                      <td className="text-sw-dim">{r.codeLabel}</td>
                      <td className="text-right font-mono">{formatCurrency(r.awarded)}</td>
                      <td className="text-right font-mono text-sw-dim">
                        {formatCurrency(r.budget)}
                      </td>
                      <td
                        className="text-right font-mono font-semibold"
                        style={{ color: r.variance > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)' }}
                      >
                        {r.variance > 0 ? '+' : ''}
                        {formatCurrency(r.variance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-1 text-[11px] text-sw-faint">
                Awarded totals are a forward commitment — they don&apos;t change committed-to-date;
                the sub&apos;s invoices/POs draw down against them.
              </div>
            </div>
          </>
        )}
      </section>

      <POForm open={creating} onClose={() => setCreating(false)} project={project} />
      {editing && (
        <POForm open onClose={() => setEditing(null)} project={project} initial={editing} />
      )}
      <SubcontractForm open={creatingSub} onClose={() => setCreatingSub(false)} project={project} />
      {editingSub && (
        <SubcontractForm
          open
          onClose={() => setEditingSub(null)}
          project={project}
          initial={editingSub}
        />
      )}
    </div>
  )
}
