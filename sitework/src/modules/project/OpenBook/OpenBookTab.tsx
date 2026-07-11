import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { computeProjectFinancials, retentionRatePct } from '../computeFinancials'

/**
 * Open Book — transliteration of legacy `Obx` (R7, PARITY gap-12 row):
 * OPEN-BOOK REPORT eyebrow, 28px project name, client · address, mono
 * "COST-PLUS · generated {date}" line, boxed report cards (rule border,
 * radius 6) with 18px section titles — Contract & Cost Summary /
 * Variations / Progress Claims / Invoices Received / Prime Cost &
 * Provisional Sum Items / Retention — and the generated-from-live-data
 * footer note. Money values per the R0 semantics core.
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
  const client = state.clients.find((c) => c.id === project.clientId)

  const claimsTotal = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const claimsApproved = claims
    .filter((c) => c.status === 'Approved')
    .reduce((s, c) => s + (c.amount || 0), 0)
  const claimsPaid = claims
    .filter((c) => c.status === 'Paid')
    .reduce((s, c) => s + (c.amount || 0), 0)
  const ratePct = retentionRatePct(state, project.id as string)
  // Legacy Obx: retention held derived from claims total × rate.
  const retHeld = (claimsTotal * ratePct) / 100

  return (
    <div className="max-w-[900px] print:space-y-4">
      {/* ── Obx header ─────────────────────────────────────────────────── */}
      <header className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1.5 font-mono text-[11px] tracking-[0.06em] text-sw-dim">
            OPEN-BOOK REPORT
          </div>
          <h2 className="text-[28px] font-bold tracking-[-0.02em] text-sw-ink">{project.name}</h2>
          <div className="mt-1 text-[13px] text-sw-dim">
            {client?.name ?? ''}
            {project.address ? ` · ${project.address}` : ''}
          </div>
          <div className="mt-2 font-mono text-[11px] text-sw-faint">
            {(project.contractType || '').toUpperCase()} · generated{' '}
            {new Date().toLocaleDateString('en-AU', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center border border-sw-rule rounded-[1px] bg-transparent px-4 py-2 text-sm font-medium text-sw-ink hover:bg-sw-muted/5 transition print:hidden"
        >
          Print / Save PDF
        </button>
      </header>

      {/* ── Contract & Cost Summary ────────────────────────────────────── */}
      <ReportCard title="Contract & Cost Summary">
        <Kv label="Original budget" value={formatCurrency(fin.originalBudget)} />
        <Kv label="Margin target" value={`${project.margin ?? 15}%`} />
        <Kv label="Original contract value" value={formatCurrency(fin.contractValue)} />
        <Kv label="Variations approved" value={formatCurrency(fin.approvedVariations)} />
        <Kv label="Variations pending" value={formatCurrency(fin.pendingVariations)} />
        <Kv
          label="Adjusted contract value"
          value={formatCurrency(fin.adjustedContractValue)}
          strong
        />
        <Kv label="Cost to date (invoices + POs)" value={formatCurrency(fin.committedToDate)} />
        <Kv label="Invoices paid" value={formatCurrency(fin.invoicesPaid)} />
      </ReportCard>

      {/* ── Variations ─────────────────────────────────────────────────── */}
      <ReportCard title="Variations" counter={`${project.variations.length} total`}>
        <ReportTable
          head={['#', 'Description', 'Status', 'Amount']}
          rightCols={[3]}
          rows={project.variations.map((v) => [
            <span key="id" className="font-mono text-sw-dim">
              {v.id}
            </span>,
            v.desc,
            <StatusBadge key="s" status={v.status} />,
            formatCurrency(v.amount),
          ])}
        />
      </ReportCard>

      {/* ── Progress Claims ────────────────────────────────────────────── */}
      <ReportCard title="Progress Claims" counter={`${claims.length} total`}>
        <ReportTable
          head={['#', 'Description', 'Date', 'Status', 'Amount']}
          rightCols={[4]}
          rows={claims.map((c) => [
            <span key="id" className="font-mono text-sw-dim">
              #{c.claimNo}
            </span>,
            c.desc,
            formatDate(c.date),
            <StatusBadge key="s" status={c.status} />,
            formatCurrency(c.amount),
          ])}
        />
        <div className="mt-2">
          <Kv label="Total approved" value={formatCurrency(claimsApproved)} />
          <Kv label="Total paid" value={formatCurrency(claimsPaid)} />
        </div>
      </ReportCard>

      {/* ── Invoices Received ──────────────────────────────────────────── */}
      <ReportCard title="Invoices Received" counter={`${project.invoices.length} total`}>
        <ReportTable
          head={['Supplier', 'Date', 'Status', 'Amount']}
          rightCols={[3]}
          rows={project.invoices.map((i) => [
            i.supplier,
            formatDate(i.date),
            <StatusBadge key="s" status={i.status} />,
            formatCurrency(i.amount),
          ])}
        />
      </ReportCard>

      {/* ── PC & PS ────────────────────────────────────────────────────── */}
      <ReportCard title="Prime Cost & Provisional Sum Items">
        <ReportTable
          head={['Description', 'Allowance', 'Actual', 'Status']}
          rightCols={[1, 2]}
          rows={[
            ...pcItems.map((p) => [
              `PC · ${p.description}`,
              formatCurrency(p.allowance),
              p.actualCost > 0 ? formatCurrency(p.actualCost) : '—',
              <StatusBadge key="s" status={p.status} />,
            ]),
            ...psItems.map((p) => [
              `PS · ${p.description}`,
              formatCurrency(p.allowance),
              p.actualCost > 0 ? formatCurrency(p.actualCost) : '—',
              <StatusBadge key="s" status={p.status} />,
            ]),
          ]}
        />
      </ReportCard>

      {/* ── Retention ──────────────────────────────────────────────────── */}
      <ReportCard title="Retention">
        <Kv label="Rate held" value={`${ratePct}%`} />
        <Kv label="Currently held" value={formatCurrency(retHeld)} strong />
      </ReportCard>

      <p className="mt-4 text-[11px] text-sw-faint">
        This open-book report is generated from live project data in SITEWORK.
      </p>
    </div>
  )
}

/** Legacy Obx card: 1px rule border, radius 6, 18px section title. */
function ReportCard({
  title,
  counter,
  children,
}: {
  title: string
  counter?: string
  children: ReactNode
}) {
  return (
    <section className="mb-4 rounded-md border border-sw-rule bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[18px] font-bold tracking-[-0.01em] text-sw-ink">{title}</h3>
        {counter && <span className="text-[12px] text-sw-dim">{counter}</span>}
      </div>
      {children}
    </section>
  )
}

/** Legacy Obx kv row: label / value over a light rule. */
function Kv({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-sw-rule-l py-1.5 text-[13px]">
      <span className="text-sw-dim">{label}</span>
      <span className="font-mono" style={{ fontWeight: strong ? 700 : 400 }}>
        {value}
      </span>
    </div>
  )
}

function ReportTable({
  head,
  rows,
  rightCols = [],
}: {
  head: string[]
  rows: ReactNode[][]
  rightCols?: number[]
}) {
  return (
    <table className="sw-table">
      <thead>
        <tr>
          {head.map((h, idx) => (
            <th key={h} className={rightCols.includes(idx) ? 'text-right' : ''}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, idx) => (
          <tr key={idx} className="border-b border-sw-rule-l last:border-0">
            {cells.map((cell, ci) => (
              <td key={ci} className={rightCols.includes(ci) ? 'text-right font-mono' : ''}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
