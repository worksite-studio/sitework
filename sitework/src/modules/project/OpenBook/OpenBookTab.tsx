import { useMemo } from 'react'
import { Card } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { computeProjectFinancials, retentionHeld } from '../computeFinancials'

/**
 * Owner-facing Open Book report — port of Obx (Phase 1.5-F). A read-only
 * snapshot of every dollar moving through the project: contract vs cost
 * summary, every variation, every progress claim, every invoice, PC/PS
 * allowance vs actual, retention held.
 *
 * Designed to be screen-shareable or printed (window.print()) — no
 * navigation widgets, no edit affordances. The legacy app shipped this
 * as the strongest answer to "how do I make cost-plus easy for owners
 * to accept".
 */
export function OpenBookTab() {
  const project = useProject()
  const state = useAppState()

  const fin = useMemo(
    () =>
      project
        ? computeProjectFinancials(project, state.purchases[project.id as string] ?? [])
        : null,
    [project, state.purchases],
  )

  if (!project || !fin) return null

  const claims = state.claims[project.id as string] ?? []
  const pcItems = state.primeCostItems[project.id as string] ?? []
  const psItems = state.provisionalSums[project.id as string] ?? []
  const heldRetention = retentionHeld(state, project.id as string)
  const client = state.clients.find((c) => c.id === project.clientId)

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <header className="space-y-1 border-b border-sw-border pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">{project.name}</h2>
            <p className="text-sm text-sw-muted">
              Open-book report · {project.contractType} · {project.state}
            </p>
            {client && (
              <p className="text-sm text-sw-muted">
                Prepared for {client.name} ({client.contact || '—'})
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center rounded-md border border-sw-border bg-sw-surface px-3 py-1.5 text-sm font-medium hover:bg-sw-muted/5 transition print:hidden"
          >
            Print / Save PDF
          </button>
        </div>
      </header>

      {/* Contract vs cost */}
      <section className="space-y-2">
        <h3 className="text-[12px] font-semibold text-sw-ink">Contract vs Cost</h3>
        <Card className="p-4">
          {/* Row set transliterated from legacy `Obx` "Contract & Cost Summary" (R0). */}
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-sw-muted">Original budget</dt>
            <dd className="text-right font-mono">{formatCurrency(fin.originalBudget)}</dd>
            <dt className="text-sw-muted">Margin target</dt>
            <dd className="text-right font-mono">{project.margin ?? 15}%</dd>
            <dt className="text-sw-muted">Original contract value</dt>
            <dd className="text-right font-mono">{formatCurrency(fin.contractValue)}</dd>
            <dt className="text-sw-muted">Variations approved</dt>
            <dd className="text-right font-mono">{formatCurrency(fin.approvedVariations)}</dd>
            <dt className="text-sw-muted">Variations pending</dt>
            <dd className="text-right font-mono">{formatCurrency(fin.pendingVariations)}</dd>
            <dt className="font-medium border-t border-sw-border pt-1">Adjusted contract value</dt>
            <dd className="font-medium border-t border-sw-border pt-1 text-right font-mono">
              {formatCurrency(fin.adjustedContractValue)}
            </dd>
            <dt className="text-sw-muted pt-2">Cost to date (invoices + POs)</dt>
            <dd className="text-right font-mono pt-2">{formatCurrency(fin.committedToDate)}</dd>
            <dt className="text-sw-muted">Invoices paid</dt>
            <dd className="text-right font-mono">{formatCurrency(fin.invoicesPaid)}</dd>
          </dl>
        </Card>
      </section>

      {/* Variations */}
      {project.variations.length > 0 && (
        <ReportSection title={`Variations (${project.variations.length})`}>
          <ReportTable
            head={['ID', 'Desc', 'Amount', 'Date', 'Status']}
            rows={project.variations.map((v) => [
              v.id,
              v.desc,
              formatCurrency(v.amount),
              formatDate(v.date),
              <StatusBadge key={`s-${v.id}`} status={v.status} />,
            ])}
          />
        </ReportSection>
      )}

      {/* Progress claims */}
      {claims.length > 0 && (
        <ReportSection title={`Progress claims (${claims.length})`}>
          <ReportTable
            head={['#', 'Desc', 'Amount', 'Date', 'Due', 'Docs', 'Status']}
            rows={claims.map((c) => [
              `#${c.claimNo}`,
              c.desc,
              formatCurrency(c.amount),
              formatDate(c.date),
              formatDate(c.due),
              (c.supportingDocs?.length ?? 0).toString(),
              <StatusBadge key={`s-${c.id}`} status={c.status} />,
            ])}
          />
        </ReportSection>
      )}

      {/* Invoices */}
      {project.invoices.length > 0 && (
        <ReportSection title={`Invoices received (${project.invoices.length})`}>
          <ReportTable
            head={['ID', 'Supplier', 'Amount', 'Date', 'Docs', 'Status']}
            rows={project.invoices.map((i) => [
              i.id,
              i.supplier,
              formatCurrency(i.amount),
              formatDate(i.date),
              project.contractType === 'cost-plus'
                ? (i.supportingDocs?.length ?? 0).toString()
                : '—',
              <StatusBadge key={`s-${i.id}`} status={i.status} />,
            ])}
          />
        </ReportSection>
      )}

      {/* PC / PS */}
      {(pcItems.length > 0 || psItems.length > 0) && (
        <ReportSection title="PC & PS items">
          <ReportTable
            head={['Description', 'Allowance', 'Actual', 'Status']}
            rows={[
              ...pcItems.map((p) => [
                `PC · ${p.description}`,
                formatCurrency(p.allowance),
                formatCurrency(p.actualCost),
                p.status,
              ]),
              ...psItems.map((p) => [
                `PS · ${p.description}`,
                formatCurrency(p.allowance),
                formatCurrency(p.actualCost),
                p.status,
              ]),
            ]}
          />
        </ReportSection>
      )}

      {/* Retention */}
      <ReportSection title="Retention">
        <Card className="p-4 text-sm">
          <p>
            <span className="text-sw-muted">Held: </span>
            <span className="font-medium">{formatCurrency(heldRetention)}</span>
          </p>
        </Card>
      </ReportSection>
    </div>
  )
}

interface ReportSectionProps {
  title: string
  children: React.ReactNode
}
function ReportSection({ title, children }: ReportSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-[12px] font-semibold text-sw-ink">{title}</h3>
      {children}
    </section>
  )
}

interface ReportTableProps {
  head: string[]
  rows: Array<Array<React.ReactNode>>
}
function ReportTable({ head, rows }: ReportTableProps) {
  return (
    <Card>
      <table className="sw-table">
        <thead>
          <tr>
            {head.map((h, idx) => (
              <th
                key={h}
                className={`px-3 py-2 font-medium ${
                  idx >= 2 && idx <= head.length - 2 ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, idx) => (
            <tr key={idx} className="border-b border-sw-border last:border-0">
              {cells.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 ${
                    ci >= 2 && ci <= head.length - 2 ? 'text-right font-mono' : ''
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
