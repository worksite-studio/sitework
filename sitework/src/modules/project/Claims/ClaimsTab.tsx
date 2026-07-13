import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import {
  claimGst,
  claimNetCertified,
  claimRetention,
  claimTotalIncGst,
  computeProjectFinancials,
  retentionRatePct,
} from '../computeFinancials'
import { ClaimForm } from './ClaimForm'
import type { ProgressClaim } from '@/types'

/**
 * Progress Claims — transliteration of legacy `Cl1` (R2, PARITY gap 12):
 * header sub-line ("X claimed of Y contract"), three stat blocks (TOTAL
 * CLAIMED / PAID TO DATE / OUTSTANDING), the full column set (Claim Date,
 * Due Date, GST, Total inc GST, Retention, Net Certified), zebra rows,
 * totals footer. Retention maths per R0 (rate is a percent; net certified
 * carries GST on the retained net). Retention-cert button, Docs flag and
 * print icon are port-additive (PARITY gap-12 "keep").
 */
export function ClaimsTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState<ProgressClaim | null>(null)
  const [creating, setCreating] = useState(false)

  const claims: ProgressClaim[] = useMemo(
    () => (project ? (state.claims[project.id as string] ?? []) : []),
    [state.claims, project],
  )
  const ratePct = project ? retentionRatePct(state, project.id as string) : 5

  if (!project) return null

  const fin = computeProjectFinancials(project)

  // Positional fallback for legacy claims with missing claimNo (session 28).
  function displayNo(c: ProgressClaim): number {
    return c.claimNo || claims.findIndex((x) => x.id === c.id) + 1
  }

  const nextNo = claims.reduce((max, c) => Math.max(max, c.claimNo || 0), 0) + 1
  const tot = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const paid = claims.filter((c) => c.status === 'Paid').reduce((s, c) => s + (c.amount || 0), 0)
  const due = claims.filter((c) => c.status === 'Approved').reduce((s, c) => s + (c.amount || 0), 0)

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-[26px] font-bold tracking-[-0.02em] text-sw-ink">
            Progress Claims
          </h2>
          <div className="text-[13px] text-sw-dim">
            {formatCurrency(tot)} claimed of {formatCurrency(fin.contractValue)} contract
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/print/retention/${project.id}`}
            target="_blank"
            className="inline-flex items-center border border-sw-rule rounded-[1px] bg-transparent px-3 py-1.5 text-sm font-medium text-sw-ink hover:bg-sw-muted/5 transition"
          >
            Retention cert
          </Link>
          <Button onClick={() => setCreating(true)}>+ New Claim</Button>
        </div>
      </header>

      {/* Legacy Cl1 stat blocks: 1px rule top, 9px label, 20px value. */}
      <div className="mb-8 flex gap-10">
        <ClaimStat label="Total Claimed" value={formatCurrency(tot)} />
        <ClaimStat label="Paid to Date" value={formatCurrency(paid)} color="var(--sw-pos)" />
        <ClaimStat
          label="Outstanding"
          value={formatCurrency(due)}
          color={due > 0 ? 'var(--sw-violet)' : 'var(--sw-pos)'}
        />
      </div>

      {claims.length === 0 ? (
        <EmptyState
          title="No progress claims yet"
          description="Raise claims against the project to track money in motion."
          action={<Button onClick={() => setCreating(true)}>+ New Claim</Button>}
        />
      ) : (
        <div className="border-t border-sw-ink">
          <table className="sw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Claim Date</th>
                <th>Due Date</th>
                <th className="text-right">Amount (ex GST)</th>
                <th className="text-right">GST</th>
                <th className="text-right">Total inc GST</th>
                <th className="text-right">Retention</th>
                <th className="text-right">Net Certified</th>
                <th>Status</th>
                <th>Docs</th>
                <th aria-label="Print" />
              </tr>
            </thead>
            <tbody>
              {claims.map((c, idx) => {
                const docCount = c.supportingDocs?.length ?? 0
                const needsDocs = project.contractType === 'cost-plus' && docCount === 0
                return (
                  <tr
                    key={c.id}
                    onClick={() => setEditing(c)}
                    className="cursor-pointer"
                    style={{ background: idx % 2 === 0 ? '#fff' : 'var(--sw-bg)' }}
                  >
                    <td className="font-mono text-sw-dim">#{displayNo(c)}</td>
                    <td className="font-medium">{c.desc}</td>
                    <td className="text-sw-dim">{formatDate(c.date)}</td>
                    <td className="text-sw-dim">{formatDate(c.due)}</td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="text-right font-mono text-sw-dim">
                      {formatCurrency(claimGst(c.amount || 0))}
                    </td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(claimTotalIncGst(c.amount || 0))}
                    </td>
                    <td className="text-right font-mono text-sw-dim">
                      −{formatCurrency(claimRetention(c.amount || 0, ratePct))}
                    </td>
                    <td className="text-right font-mono font-semibold">
                      {formatCurrency(claimNetCertified(c.amount || 0, ratePct))}
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
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
                        to={`/print/claim/${project.id}/${c.id}`}
                        target="_blank"
                        aria-label={`Print claim #${displayNo(c)}`}
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
          <div className="flex justify-between border-t border-sw-rule bg-sw-bg px-4 py-3">
            <span className="text-[12px] text-sw-dim">
              {claims.length} claim{claims.length !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-[13px] font-semibold">
              Total inc GST: {formatCurrency(claimTotalIncGst(tot))}
            </span>
          </div>
        </div>
      )}

      <ClaimForm
        open={creating}
        onClose={() => setCreating(false)}
        project={project}
        nextNo={nextNo}
      />
      {editing && (
        <ClaimForm
          open
          onClose={() => setEditing(null)}
          project={project}
          initial={editing}
          nextNo={displayNo(editing)}
        />
      )}
    </div>
  )
}

/** Legacy Cl1 mini stat: 1px rule top, 9px caption, 20px value. */
function ClaimStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-t border-sw-rule py-3">
      <div className="mb-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div className="text-[20px] font-bold" style={{ color: color ?? 'var(--sw-ink)' }}>
        {value}
      </div>
    </div>
  )
}
