import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useProject } from '../useProject'
import { InvoiceForm } from './InvoiceForm'
import type { CostCodeId, Invoice } from '@/types'

/**
 * Invoices tab — port of legacy O1v2. Row-click edit, totals footer,
 * inline supportingDocs indicator (cost-plus only — substantiation badge
 * shows ✓ when ≥1 doc attached, "!" when 0).
 */
export function InvoicesTab() {
  const project = useProject()
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [creating, setCreating] = useState(false)

  const codeLookup = useMemo(() => {
    const m = new Map<string, string>()
    if (project) for (const c of project.codes) m.set(c.id as string, c.code)
    return (id: CostCodeId) => m.get(id as string) ?? '—'
  }, [project])

  if (!project) return null

  const invoices = project.invoices
  const totalPaid = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + (i.amount || 0), 0)
  const totalOutstanding = invoices
    .filter((i) => i.status === 'Approved' || i.status === 'Pending')
    .reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Invoices</h2>
          <p className="text-xs text-sw-muted">
            Paid: <span className="text-sw-text font-medium">{formatCurrency(totalPaid)}</span> ·
            Outstanding: {formatCurrency(totalOutstanding)}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={project.codes.length === 0}>
          + New Invoice
        </Button>
      </header>

      {project.codes.length === 0 ? (
        <EmptyState
          title="No cost codes yet"
          description="Add a cost code on the BOQ tab before recording invoices."
        />
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Record supplier and subcontractor invoices against the project's cost codes."
          action={<Button onClick={() => setCreating(true)}>+ New Invoice</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Supplier</th>
                <th>Code</th>
                <th className="text-right">Amount</th>
                <th>Date</th>
                <th>Due</th>
                <th>Docs</th>
                <th>Status</th>
                <th aria-label="Print" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const docCount = inv.supportingDocs?.length ?? 0
                const needsDocs = project.contractType === 'cost-plus' && docCount === 0
                return (
                  <tr
                    key={inv.id}
                    onClick={() => setEditing(inv)}
                    className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                  >
                    <td className="text-sw-muted font-mono">{inv.id}</td>
                    <td>{inv.supplier}</td>
                    <td className="text-sw-muted">{codeLookup(inv.ccId)}</td>
                    <td className="text-right font-mono">{formatCurrency(inv.amount)}</td>
                    <td className="text-sw-muted">{formatDate(inv.date)}</td>
                    <td className="text-sw-muted">{formatDate(inv.due)}</td>
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
                    <td>
                      <StatusBadge status={inv.status} />
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
              })}
            </tbody>
          </table>
        </div>
      )}

      <InvoiceForm open={creating} onClose={() => setCreating(false)} project={project} />
      {editing && (
        <InvoiceForm open onClose={() => setEditing(null)} project={project} initial={editing} />
      )}
    </div>
  )
}
