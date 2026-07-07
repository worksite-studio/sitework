import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { ClaimForm } from './ClaimForm'
import type { ProgressClaim } from '@/types'

/**
 * Progress Claims tab — port of legacy Cl1. The canary for the React port:
 * substantiation gate (1.5-A), claimNo auto-fill + positional fallback for
 * legacy bad records (session 28), retention applied at the calc layer
 * (Net Certified shown alongside Amount).
 *
 * Net Certified = amount × (1 − retention rate). The legacy app's session 13
 * formula (×1.1 GST) is preserved in legacy seed amounts; here we treat the
 * claim amount as incl-GST verbatim from seed and display retention as a
 * straight percentage off.
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
  const retentionRate = project ? (state.retention[project.id as string]?.rate ?? 0.05) : 0.05

  if (!project) return null

  // Positional fallback for legacy claims with missing claimNo (session 28).
  function displayNo(c: ProgressClaim): number {
    return c.claimNo || claims.findIndex((x) => x.id === c.id) + 1
  }

  const nextNo = claims.reduce((max, c) => Math.max(max, c.claimNo || 0), 0) + 1
  const totalIssued = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const totalPaid = claims
    .filter((c) => c.status === 'Paid')
    .reduce((s, c) => s + (c.amount || 0), 0)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Progress Claims</h2>
          <p className="text-xs text-sw-muted">
            Paid: <span className="text-sw-text font-medium">{formatCurrency(totalPaid)}</span> ·
            Total issued: {formatCurrency(totalIssued)}
            {project.contractType === 'cost-plus' && (
              <>
                {' '}
                · <span className="text-sw-muted">Substantiation required (cost-plus)</span>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/print/retention/${project.id}`}
            target="_blank"
            className="inline-flex items-center rounded-md border border-sw-border bg-sw-surface px-3 py-1.5 text-sm font-medium hover:bg-sw-muted/5 transition"
          >
            Retention cert
          </Link>
          <Button onClick={() => setCreating(true)}>+ New Claim</Button>
        </div>
      </header>

      {claims.length === 0 ? (
        <EmptyState
          title="No progress claims yet"
          description="Raise claims against the project to track money in motion."
          action={<Button onClick={() => setCreating(true)}>+ New Claim</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Retention</th>
                <th className="text-right">Net certified</th>
                <th>Date</th>
                <th>Due</th>
                <th>Docs</th>
                <th>Status</th>
                <th aria-label="Print" />
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => {
                const retention = (c.amount || 0) * retentionRate
                const netCertified = (c.amount || 0) - retention
                const docCount = c.supportingDocs?.length ?? 0
                const needsDocs = project.contractType === 'cost-plus' && docCount === 0
                return (
                  <tr
                    key={c.id}
                    onClick={() => setEditing(c)}
                    className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                  >
                    <td className="font-mono font-medium">#{displayNo(c)}</td>
                    <td>{c.desc}</td>
                    <td className="text-right font-mono">{formatCurrency(c.amount)}</td>
                    <td className="text-right font-mono text-sw-muted">
                      −{formatCurrency(retention)}
                    </td>
                    <td className="text-right font-mono font-medium">
                      {formatCurrency(netCertified)}
                    </td>
                    <td className="text-sw-muted">{formatDate(c.date)}</td>
                    <td className="text-sw-muted">{formatDate(c.due)}</td>
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
                      <StatusBadge status={c.status} />
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
