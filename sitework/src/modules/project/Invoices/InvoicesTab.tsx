import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, EmptyState, EntityLink, FilterBanner } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { gstOf, incGst } from '@/lib/money'
import { useTableSort } from '@/lib/useTableSort'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { InvoiceForm } from './InvoiceForm'
import type { Invoice, InvoiceStatus } from '@/types'

const FILTERS = ['All', 'Pending', 'Approved', 'Paid'] as const
type Filter = (typeof FILTERS)[number]
type InvoiceSortKey = 'supplier' | 'code' | 'date' | 'due' | 'amount' | 'status'

/**
 * Invoices — transliteration of legacy `O1v2` (R2, PARITY gap 12): header
 * stat line (paid · approved · total), status filter chips, the full column
 * set (Doc Ref, cost code + description, GST, Total inc GST), zebra rows,
 * totals footer. Row-click edits.
 *
 * Legacy quirk preserved: the table declares a "Comments" header but rows
 * never render a comments cell, so the Status text sits under the Comments
 * column and the trailing Status column is empty — :8766 renders exactly
 * this and the side-by-side must match. Docs flag + print icon columns are
 * port-additive (PARITY gap-12 "keep").
 */
export function InvoicesTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  // Drill-through filters (Phase 4.5-C): ?cc from a BOQ code, ?sup from a
  // supplier cell. Render-time only — the filter lives in the URL.
  const ccFilter = searchParams.get('cc')
  const supFilter = searchParams.get('sup')

  const supplierName = (inv: Invoice): string => {
    const sub = inv.subId ? state.subs.find((s) => (s.id as string) === inv.subId) : null
    return sub?.name || inv.supplier || '—'
  }
  const codeText = (inv: Invoice): string => {
    const cc = project?.codes.find((c) => c.id === inv.ccId)
    return cc ? `${cc.code} ${cc.desc}` : '—'
  }

  const all = project?.invoices ?? []
  let filtered = filter === 'All' ? all : all.filter((i) => i.status === (filter as InvoiceStatus))
  if (ccFilter) filtered = filtered.filter((i) => (i.ccId as string) === ccFilter)
  if (supFilter) filtered = filtered.filter((i) => supplierName(i) === supFilter)
  const q = search.trim().toLowerCase()
  if (q)
    filtered = filtered.filter(
      (i) =>
        supplierName(i).toLowerCase().includes(q) ||
        (i.docRef ?? '').toLowerCase().includes(q) ||
        codeText(i).toLowerCase().includes(q),
    )

  // Sortable columns (Phase 4.5-E).
  const { sorted, toggle, indicator, ariaSort } = useTableSort<Invoice, InvoiceSortKey>(filtered, {
    supplier: supplierName,
    code: codeText,
    date: (i) => i.date,
    due: (i) => i.due,
    amount: (i) => i.amount || 0,
    status: (i) => i.status,
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

  const sortTh = (label: string, key: InvoiceSortKey, className = '') => (
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

  const paid = all.filter((i) => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0)
  const approved = all
    .filter((i) => i.status === 'Approved')
    .reduce((s, i) => s + (i.amount || 0), 0)
  const total = all.reduce((s, i) => s + (i.amount || 0), 0)
  // Footer total reflects the rows currently shown (search + filters), so it
  // sums to what's on screen; equals `total` when nothing is filtered.
  const shownTotal = filtered.reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Invoices</h2>
          <div className="text-[13px] text-sw-dim">
            {formatCurrency(paid)} paid · {formatCurrency(approved)} approved ·{' '}
            {formatCurrency(total)} total
          </div>
        </div>
        <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
          + Invoice
        </Button>
      </header>

      {/* Legacy status filter chips + supplier search (Phase 4.5-E). */}
      <div className="mb-5 flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="cursor-pointer px-3.5 py-[5px] text-[12px]"
            style={{
              border: `1px solid ${filter === f ? 'var(--sw-ink)' : 'var(--sw-rule)'}`,
              background: filter === f ? 'var(--sw-ink)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--sw-dim)',
            }}
          >
            {f}
          </button>
        ))}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search supplier / ref / code…"
          aria-label="Search invoices"
          className="ml-auto w-[240px] border-b border-sw-rule bg-transparent px-1 py-[5px] text-[12px] text-sw-ink focus:border-sw-ink focus:outline-none"
        />
      </div>

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

      {project.codes.length === 0 ? (
        <EmptyState
          title="No cost codes yet"
          description="Add a cost code on the BOQ tab before recording invoices."
        />
      ) : (
        <div className="border-t border-sw-ink">
          <table className="sw-table">
            <thead>
              <tr>
                {sortTh('Supplier / Subcontractor', 'supplier')}
                <th>Doc Ref</th>
                {sortTh('Cost Code', 'code')}
                {sortTh('Date', 'date')}
                {sortTh('Due', 'due')}
                {sortTh('Amount (ex GST)', 'amount', 'text-right')}
                <th className="text-right">GST</th>
                <th className="text-right">Total inc GST</th>
                <th>Comments</th>
                {sortTh('Status', 'status')}
                <th>Docs</th>
                <th aria-label="Print" />
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((inv, idx) => {
                  const docCount = inv.supportingDocs?.length ?? 0
                  const needsDocs = project.contractType === 'cost-plus' && docCount === 0
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setEditing(inv)}
                      className="cursor-pointer"
                      style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}
                    >
                      <td className="font-semibold">
                        <EntityLink
                          to={paramSearch('sup', supplierName(inv))}
                          stopPropagation
                          className="font-semibold text-sw-ink"
                        >
                          {supplierName(inv)}
                        </EntityLink>
                      </td>
                      <td className="font-mono text-sw-dim">{inv.docRef || '—'}</td>
                      <td className="text-sw-dim">
                        {inv.ccId ? (
                          <EntityLink to="../boq" stopPropagation className="text-sw-dim">
                            {codeText(inv)}
                          </EntityLink>
                        ) : (
                          codeText(inv)
                        )}
                      </td>
                      <td className="text-sw-dim">{formatDate(inv.date)}</td>
                      <td className="text-sw-dim">{formatDate(inv.due)}</td>
                      <td className="text-right font-mono font-semibold">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="text-right font-mono text-sw-dim">
                        {formatCurrency(gstOf(inv.amount))}
                      </td>
                      <td className="text-right font-mono font-semibold">
                        {formatCurrency(incGst(inv.amount))}
                      </td>
                      {/* Legacy quirk: status renders under the Comments header. */}
                      <td>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td />
                      <td>
                        {project.contractType === 'fixed-price' ? (
                          <span className="text-xs text-sw-muted">—</span>
                        ) : needsDocs ? (
                          <span
                            className="inline-flex items-center text-xs font-medium text-sw-danger"
                            title="Substantiation missing"
                          >
                            !
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-sw-success">
                            ✓ {docCount}
                          </span>
                        )}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/print/invoice/${project.id}/${inv.id}`}
                          target="_blank"
                          aria-label={`Print invoice ${inv.id}`}
                          className="text-sw-muted hover:text-sw-text text-sm transition px-2"
                        >
                          🖨
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-[13px] text-sw-faint">
                    {q || filter !== 'All' || ccFilter || supFilter
                      ? 'No invoices match this filter.'
                      : 'No invoices yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="flex justify-between border-t border-sw-rule bg-sw-bg px-4 py-3">
              <span className="text-[12px] text-sw-dim">
                {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
              </span>
              <span className="font-mono text-[13px] font-semibold">
                Total inc GST: {formatCurrency(incGst(shownTotal))}
              </span>
            </div>
          )}
        </div>
      )}

      <InvoiceForm open={creating} onClose={() => setCreating(false)} project={project} />
      {editing && (
        <InvoiceForm open onClose={() => setEditing(null)} project={project} initial={editing} />
      )}
    </div>
  )
}
