import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, EmptyState, EntityLink, FilterBanner } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { gstOf, incGst } from '@/lib/money'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { InvoiceForm } from './InvoiceForm'
import type { Invoice, InvoiceStatus } from '@/types'

const FILTERS = ['All', 'Pending', 'Approved', 'Paid'] as const
type Filter = (typeof FILTERS)[number]

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
  const [searchParams, setSearchParams] = useSearchParams()

  if (!project) return null

  // Drill-through filters (Phase 4.5-C): ?cc from a BOQ code, ?sup from a
  // supplier cell. Render-time only — the filter lives in the URL.
  const ccFilter = searchParams.get('cc')
  const supFilter = searchParams.get('sup')
  function clearParam(key: string) {
    const next = new URLSearchParams(searchParams)
    next.delete(key)
    setSearchParams(next, { replace: true })
  }
  function paramSearch(key: string, val: string) {
    const next = new URLSearchParams(searchParams)
    next.set(key, val)
    return { search: `?${next.toString()}` }
  }
  const ccFilterCode = ccFilter ? project.codes.find((c) => (c.id as string) === ccFilter) : null

  const all = project.invoices
  let invoices = filter === 'All' ? all : all.filter((i) => i.status === (filter as InvoiceStatus))
  if (ccFilter) invoices = invoices.filter((i) => (i.ccId as string) === ccFilter)
  if (supFilter) invoices = invoices.filter((i) => supplierName(i) === supFilter)
  const paid = all.filter((i) => i.status === 'Paid').reduce((s, i) => s + (i.amount || 0), 0)
  const approved = all
    .filter((i) => i.status === 'Approved')
    .reduce((s, i) => s + (i.amount || 0), 0)
  const total = all.reduce((s, i) => s + (i.amount || 0), 0)
  // Footer total reflects the rows currently shown (so a filtered view sums to
  // what's on screen); equals `total` when nothing is filtered.
  const shownTotal = invoices.reduce((s, i) => s + (i.amount || 0), 0)

  function supplierName(inv: Invoice): string {
    const sub = inv.subId ? state.subs.find((s) => (s.id as string) === inv.subId) : null
    return sub?.name || inv.supplier || '—'
  }
  function codeText(inv: Invoice): string {
    const cc = project?.codes.find((c) => c.id === inv.ccId)
    return cc ? `${cc.code} ${cc.desc}` : '—'
  }

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

      {/* Legacy status filter chips: square, ink-filled when active. */}
      <div className="mb-5 flex gap-2">
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
                <th>Supplier / Subcontractor</th>
                <th>Doc Ref</th>
                <th>Cost Code</th>
                <th>Date</th>
                <th>Due</th>
                <th className="text-right">Amount (ex GST)</th>
                <th className="text-right">GST</th>
                <th className="text-right">Total inc GST</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Docs</th>
                <th aria-label="Print" />
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((inv, idx) => {
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
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {invoices.length > 0 && (
            <div className="flex justify-between border-t border-sw-rule bg-sw-bg px-4 py-3">
              <span className="text-[12px] text-sw-dim">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
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
