import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import {
  claimRef,
  computeProjectFinancials,
  retentionRatePct as retentionRateFor,
} from '@/modules/project/computeFinancials'
import type { ProgressClaimId, ProjectId } from '@/types'

/**
 * Progress Claim PDF — single-claim printable summary.
 *
 * Route: /print/claim/:projectId/:claimId
 * Layout (top-down): builder header → claim header → line summary →
 * retention line → certified totals → notes block.
 */
export function ProgressClaimPrint() {
  const { projectId, claimId } = useParams<{ projectId: string; claimId: string }>()
  const state = useAppState()

  const project = state.projects.find((p) => p.id === (projectId as ProjectId))
  const claim = project
    ? (state.claims[project.id as string] ?? []).find((c) => c.id === (claimId as ProgressClaimId))
    : null
  const client = project ? state.clients.find((c) => c.id === project.clientId) : null
  // Rate is a PERCENT (legacy unit — PARITY gap 18); 0 when retention is
  // disabled for the project (4.7-I optional retention).
  const retentionRatePct = project ? retentionRateFor(state, project.id as string) : 5

  if (!project || !claim) {
    return (
      <PrintLayout title="Progress Claim — not found" backTo="/" autoPrint={false}>
        <p>Claim not found.</p>
      </PrintLayout>
    )
  }

  const gross = claim.amount || 0
  const retention = (gross * retentionRatePct) / 100
  const netCertified = gross - retention

  // Claim statement (4.7-I): where this claim sits against the contract.
  // "Claimed" mirrors the on-screen Cl1 header — Σ claim amounts (ex GST)
  // against the ex-GST contract value. Previous = claims numbered before this.
  const fin = computeProjectFinancials(project)
  const allClaims = state.claims[project.id as string] ?? []
  const previouslyClaimed = allClaims
    .filter((c) => (c.claimNo || 0) < (claim.claimNo || 0))
    .reduce((s, c) => s + (c.amount || 0), 0)
  const claimedToDate = previouslyClaimed + gross
  const remainingToBill = fin.contractValue - claimedToDate
  const ref = claimRef(project.id as string, claim.claimNo)

  return (
    <PrintLayout title={`Progress Claim ${ref}`} backTo={`/projects/${project.id}/claims`}>
      <header className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1>{(state.settings.businessName as string) || 'Worksite Studio'}</h1>
          <div className="text-xs text-sw-muted mt-0.5">
            ABN {(state.settings.abn as string) || '—'} · Licence{' '}
            {(state.settings.licence as string) || '—'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-sw-muted">Progress claim</div>
          <div className="text-lg font-semibold tabular-nums">{ref}</div>
          <div className="text-xs text-sw-muted">Claim #{claim.claimNo}</div>
          <div className="text-xs text-sw-muted">Date: {formatDate(claim.date)}</div>
          <div className="text-xs text-sw-muted">Due: {formatDate(claim.due)}</div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <h2>Bill to</h2>
          <p className="font-medium">{client?.name ?? '—'}</p>
          <p className="text-xs">{client?.address ?? ''}</p>
        </div>
        <div>
          <h2>Project</h2>
          <p className="font-medium">{project.name}</p>
          <p className="text-xs">{project.address}</p>
          <p className="text-xs">
            {project.contractType} · {project.state} · {project.contractForm}
          </p>
        </div>
      </section>

      <section className="mb-5">
        <h2>Claim line</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Retention ({retentionRatePct.toFixed(1)}%)</th>
              <th className="text-right">Net certified</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{claim.claimNo}</td>
              <td>{claim.desc}</td>
              <td className="text-right tabular-nums">{formatCurrency(gross)}</td>
              <td className="text-right tabular-nums">−{formatCurrency(retention)}</td>
              <td className="text-right tabular-nums font-medium">
                {formatCurrency(netCertified)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Net amount certified</td>
              <td className="text-right tabular-nums">{formatCurrency(gross)}</td>
              <td className="text-right tabular-nums">−{formatCurrency(retention)}</td>
              <td className="text-right tabular-nums">{formatCurrency(netCertified)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mb-5">
        <h2>Claim summary</h2>
        <table>
          <tbody>
            <tr>
              <td>Contract value (ex GST)</td>
              <td className="text-right tabular-nums">{formatCurrency(fin.contractValue)}</td>
            </tr>
            <tr>
              <td>Previously claimed</td>
              <td className="text-right tabular-nums">{formatCurrency(previouslyClaimed)}</td>
            </tr>
            <tr>
              <td>This claim ({ref})</td>
              <td className="text-right tabular-nums">{formatCurrency(gross)}</td>
            </tr>
            <tr>
              <td className="font-medium">Claimed to date</td>
              <td className="text-right tabular-nums font-medium">
                {formatCurrency(claimedToDate)}
              </td>
            </tr>
            <tr>
              <td className="font-medium">Remaining to bill</td>
              <td className="text-right tabular-nums font-medium">
                {formatCurrency(remainingToBill)}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {claim.notes && (
        <section className="mb-5">
          <h2>Notes</h2>
          <p>{claim.notes}</p>
        </section>
      )}

      {project.contractType === 'cost-plus' &&
        claim.supportingDocs &&
        claim.supportingDocs.length > 0 && (
          <section className="mb-5">
            <h2>Supporting documents</h2>
            <ul className="text-xs space-y-0.5">
              {claim.supportingDocs.map((d, idx) => (
                <li key={`${d.name}-${idx}`}>
                  • {d.name}
                  {d.size > 0 && (
                    <span className="text-sw-muted ml-2">({Math.round(d.size / 1024)} KB)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

      <section className="mt-8 pt-6 border-t border-sw-border grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-sw-muted">Builder signature</p>
          <div className="border-b border-sw-border h-12" />
          <p className="text-xs mt-1">Date</p>
        </div>
        <div>
          <p className="text-xs text-sw-muted">Owner / superintendent</p>
          <div className="border-b border-sw-border h-12" />
          <p className="text-xs mt-1">Date</p>
        </div>
      </section>
    </PrintLayout>
  )
}
