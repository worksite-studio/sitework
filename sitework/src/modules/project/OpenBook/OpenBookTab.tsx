import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import {
  codeDocTotals,
  computeProjectFinancials,
  reconcilePcPs,
  retentionRatePct,
} from '../computeFinancials'

/**
 * Open Book — the client-facing cost-transparency report (Phase 4.7-N,
 * bucket C). Builds on the legacy `Obx` card layout and adds the pieces the
 * design called for:
 *
 *   cover (builder + project identity, headline position)
 *   → contract & cost summary
 *   → COST BREAKDOWN BY CODE with the invoices booked to each code listed
 *     inline — the cost-plus audit trail (substantiate every dollar; NSW SOP
 *     requires receipts per claim). Attached files are referenced as
 *     "Appendix A" until Storage lands (Phase 5-D).
 *   → variations register with approval evidence
 *   → progress claims → PC & PS reconciliation → retention & DLP.
 *
 * Money values follow the R0 semantics core.
 */
export function OpenBookTab() {
  const project = useProject()
  const state = useAppState()

  const purchases = useMemo(
    () => (project ? (state.purchases[project.id as string] ?? []) : []),
    [project, state.purchases],
  )
  const fin = useMemo(
    () => (project ? computeProjectFinancials(project, purchases) : null),
    [project, purchases],
  )

  if (!project || !fin) return null

  const pid = project.id as string
  const claims = state.claims[pid] ?? []
  const pcItems = state.primeCostItems[pid] ?? []
  const psItems = state.provisionalSums[pid] ?? []
  const client = state.clients.find((c) => c.id === project.clientId)
  const retention = state.retention[pid]

  const claimsTotal = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const claimsApproved = claims
    .filter((c) => c.status === 'Approved')
    .reduce((s, c) => s + (c.amount || 0), 0)
  const claimsPaid = claims
    .filter((c) => c.status === 'Paid')
    .reduce((s, c) => s + (c.amount || 0), 0)
  const ratePct = retentionRatePct(state, pid)
  const retHeld = retention?.held ?? (claimsTotal * ratePct) / 100
  const retReleased = retention?.released ?? 0

  // Defects-liability window — from the retention record (k1).
  const pcDate = retention?.pcDate ? new Date(retention.pcDate) : null
  const dlpEnd =
    pcDate && retention?.dlpMonths
      ? new Date(pcDate.getTime() + retention.dlpMonths * 30.44 * 86400000)
      : null

  // Cost codes carrying any budget or activity — the audit spine.
  const activeCodes = project.codes
    .map((c) => {
      const invoices = project.invoices.filter((i) => i.ccId === c.id)
      const totals = codeDocTotals(c.id as string, project.invoices, purchases)
      const vars = project.variations
        .filter((v) => v.status === 'Approved' && v.ccId === c.id)
        .reduce((s, v) => s + (v.amount || 0), 0)
      return { code: c, invoices, ...totals, vars }
    })
    .filter((r) => (r.code.budget || 0) !== 0 || r.invoices.length > 0 || r.committed !== 0)

  const receiptsTotal = activeCodes.reduce(
    (s, r) => s + r.invoices.reduce((n, i) => n + (i.amount || 0), 0),
    0,
  )
  const docsAttached = project.invoices.reduce((n, i) => n + (i.supportingDocs?.length ?? 0), 0)

  return (
    <div className="max-w-[900px] print:space-y-4">
      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <header className="mb-6 border-b-2 border-sw-ink pb-5">
        <div className="flex items-start justify-between">
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
              {(project.contractType || '').toUpperCase()} · {project.state} · generated{' '}
              {new Date().toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-semibold text-sw-ink">
              {(state.settings.businessName as string) || 'Worksite Studio'}
            </div>
            <div className="text-[11px] text-sw-faint">
              ABN {(state.settings.abn as string) || '—'}
            </div>
            <div className="text-[11px] text-sw-faint">
              Licence {(state.settings.licence as string) || '—'}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-3 inline-flex items-center rounded-[1px] border border-sw-rule bg-transparent px-4 py-2 text-sm font-medium text-sw-ink transition hover:bg-sw-muted/5 print:hidden"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Headline position */}
        <div className="mt-5 flex flex-wrap gap-10">
          <Headline label="Adjusted contract" value={formatCurrency(fin.adjustedContractValue)} />
          <Headline label="Cost to date" value={formatCurrency(fin.costToDate)} />
          <Headline label="Claimed to date" value={formatCurrency(claimsTotal)} />
          <Headline
            label="Retention held"
            value={ratePct > 0 ? formatCurrency(retHeld - retReleased) : 'None'}
          />
        </div>
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

      {/* ── Cost breakdown by code, with receipts inline ───────────────── */}
      <ReportCard
        title="Cost Breakdown by Code"
        counter={`${activeCodes.length} codes · ${formatCurrency(receiptsTotal)} invoiced`}
      >
        <p className="mb-4 text-[12px] text-sw-dim">
          Every dollar booked to this project, by cost code, with the invoices substantiating it.
          Attached receipts and timesheets are filed as Appendix A ({docsAttached} document
          {docsAttached === 1 ? '' : 's'} on file).
        </p>
        {activeCodes.map(({ code, invoices, committed, vars }) => {
          const adjBudget = (code.budget || 0) + vars
          const over = committed - adjBudget
          return (
            <div key={code.id as string} className="mb-4 border-t border-sw-rule pt-2.5 last:mb-0">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-sw-ink">
                  <span className="mr-2 font-mono text-[11px] text-sw-dim">{code.code}</span>
                  {code.desc}
                </span>
                <span className="shrink-0 font-mono text-[12px]">
                  {formatCurrency(committed)}{' '}
                  <span className="text-sw-faint">/ {formatCurrency(adjBudget)}</span>
                </span>
              </div>
              {over > 0 && (
                <div className="mb-1.5 text-[11px] text-sw-neg">
                  {formatCurrency(over)} over the adjusted budget
                </div>
              )}
              {invoices.length > 0 ? (
                <table className="sw-table">
                  <thead>
                    <tr>
                      <th>Supplier</th>
                      <th>Doc ref</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-right">Amount</th>
                      <th className="text-right">Docs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id as string} className="border-b border-sw-rule-l last:border-0">
                        <td>{i.supplier}</td>
                        <td className="font-mono text-sw-dim">{i.docRef || '—'}</td>
                        <td className="text-sw-dim">{formatDate(i.date)}</td>
                        <td>
                          <StatusBadge status={i.status} />
                        </td>
                        <td className="text-right font-mono">{formatCurrency(i.amount)}</td>
                        <td className="text-right font-mono text-sw-dim">
                          {i.supportingDocs?.length ? `${i.supportingDocs.length}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-[11px] text-sw-faint">No invoices booked to this code.</div>
              )}
            </div>
          )
        })}
      </ReportCard>

      {/* ── Variations register ────────────────────────────────────────── */}
      <ReportCard title="Variations Register" counter={`${project.variations.length} total`}>
        <ReportTable
          head={['#', 'Description', 'Requested by', 'Date', 'Status', 'Amount']}
          rightCols={[5]}
          rows={project.variations.map((v) => [
            <span key="id" className="font-mono text-sw-dim">
              {v.id}
            </span>,
            v.desc,
            v.requestedBy ?? '—',
            v.date ? formatDate(v.date) : '—',
            <StatusBadge key="s" status={v.status} />,
            formatCurrency(v.amount),
          ])}
        />
        <p className="mt-2 text-[11px] text-sw-faint">
          Approved variations are adjustments to the contract sum, evidenced by the owner's written
          approval held on file.
        </p>
      </ReportCard>

      {/* ── Progress claims ────────────────────────────────────────────── */}
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
          <Kv label="Total claimed" value={formatCurrency(claimsTotal)} />
          <Kv label="Total approved" value={formatCurrency(claimsApproved)} />
          <Kv label="Total paid" value={formatCurrency(claimsPaid)} />
        </div>
      </ReportCard>

      {/* ── PC & PS reconciliation ─────────────────────────────────────── */}
      <ReportCard
        title="Prime Cost & Provisional Sum Reconciliation"
        counter={`${pcItems.length + psItems.length} items`}
      >
        <ReportTable
          head={['Item', 'Allowance', 'Actual', 'Variance', 'Margin on excess', 'Net to claim']}
          rightCols={[1, 2, 3, 4, 5]}
          rows={[
            ...pcItems.map((p) => ['PC', p] as const),
            ...psItems.map((p) => ['PS', p] as const),
          ].map(([kind, p]) => {
            const r = reconcilePcPs(p.allowance, p.actualCost, p.marginRate)
            return [
              `${kind} · ${p.description}`,
              formatCurrency(r.allowance),
              r.actualCost > 0 ? formatCurrency(r.actualCost) : '—',
              <span key="v" style={{ color: r.variance > 0 ? 'var(--sw-neg)' : 'var(--sw-pos)' }}>
                {r.variance > 0 ? '+' : ''}
                {formatCurrency(r.variance)}
              </span>,
              r.marginOnExcess > 0 ? formatCurrency(r.marginOnExcess) : '—',
              <span key="n" className="font-semibold">
                {r.netToClaim > 0 ? '+' : ''}
                {formatCurrency(r.netToClaim)}
              </span>,
            ]
          })}
        />
        <p className="mt-2 text-[11px] text-sw-faint">
          Margin is applied to the excess over the allowance only — an item under its allowance is
          credited back in full.
        </p>
      </ReportCard>

      {/* ── Retention & DLP ────────────────────────────────────────────── */}
      <ReportCard title="Retention & Defects Liability">
        {ratePct > 0 ? (
          <>
            <Kv label="Retention rate" value={`${ratePct}%`} />
            <Kv label="Retention held" value={formatCurrency(retHeld)} />
            <Kv label="Retention released" value={formatCurrency(retReleased)} />
            <Kv label="Balance held" value={formatCurrency(retHeld - retReleased)} strong />
          </>
        ) : (
          <Kv label="Retention" value="Not applied to this contract" strong />
        )}
        <Kv
          label="Practical completion"
          value={retention?.pcDate ? formatDate(retention.pcDate) : 'Not set'}
        />
        <Kv
          label="Defects liability period"
          value={retention?.dlpMonths ? `${retention.dlpMonths} months` : '—'}
        />
        <Kv
          label="End of DLP"
          value={dlpEnd ? formatDate(dlpEnd.toISOString().slice(0, 10)) : 'Pending'}
        />
        <Kv
          label="Final financial completion"
          value={retention?.ffcDate ? formatDate(retention.ffcDate) : 'Pending'}
        />
      </ReportCard>

      <p className="mt-4 text-[11px] text-sw-faint">
        This open-book report is generated from live project data in SITEWORK. Supporting receipts,
        timesheets and subcontractor invoices are held on file and referenced as Appendix A.
      </p>
    </div>
  )
}

/** Cover headline figure. */
function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div className="text-[20px] font-bold tracking-[-0.02em] text-sw-ink">{value}</div>
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
    <section className="mb-4 rounded-md border border-sw-rule bg-white p-5 print:break-inside-avoid">
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
