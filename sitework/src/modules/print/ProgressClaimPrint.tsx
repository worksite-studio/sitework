import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
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
  const retentionRate = project ? (state.retention[project.id as string]?.rate ?? 0.05) : 0.05

  if (!project || !claim) {
    return (
      <PrintLayout title="Progress Claim — not found" backTo="/" autoPrint={false}>
        <p>Claim not found.</p>
      </PrintLayout>
    )
  }

  const gross = claim.amount || 0
  const retention = gross * retentionRate
  const netCertified = gross - retention

  return (
    <PrintLayout
      title={`Progress Claim #${claim.claimNo}`}
      backTo={`/projects/${project.id}/claims`}
    >
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
          <div className="text-lg font-semibold">#{claim.claimNo}</div>
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
              <th className="text-right">Retention ({(retentionRate * 100).toFixed(1)}%)</th>
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
