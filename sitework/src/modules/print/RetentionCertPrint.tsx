import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { retentionRatePct } from '@/modules/project/computeFinancials'
import type { ProjectId } from '@/types'

/**
 * Retention / Final Fix Certificate — summary of retention held + released
 * across the project's progress claims. Used as the cover sheet when
 * releasing retention at practical completion or end of defects liability.
 */
export function RetentionCertPrint() {
  const { projectId } = useParams<{ projectId: string }>()
  const state = useAppState()
  const project = state.projects.find((p) => p.id === (projectId as ProjectId))

  if (!project) {
    return (
      <PrintLayout title="Retention certificate — not found" backTo="/" autoPrint={false}>
        <p>Project not found.</p>
      </PrintLayout>
    )
  }

  const claims = state.claims[project.id as string] ?? []
  // Rate is a PERCENT (legacy unit — PARITY gap 18); 0 when retention is
  // disabled for the project (4.7-I optional retention).
  const retention = state.retention[project.id as string] ?? { rate: 5, held: 0, released: 0 }
  const ratePct = retentionRatePct(state, project.id as string)
  const client = state.clients.find((c) => c.id === project.clientId)
  const totalCertified = claims.reduce((s, c) => s + (c.amount || 0), 0)
  const totalRetained = (totalCertified * ratePct) / 100
  const heldTotal = retention.held ?? totalRetained
  const releasedTotal = retention.released ?? 0
  const balance = heldTotal - releasedTotal

  return (
    <PrintLayout title="Retention certificate" backTo={`/projects/${project.id}/claims`}>
      <header className="mb-5">
        <div className="text-xs uppercase tracking-wide text-sw-muted">Certificate</div>
        <h1>Retention summary</h1>
        <p className="text-xs text-sw-muted">
          Generated {new Date().toLocaleDateString('en-AU')} · Project {project.name}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <h2>Project</h2>
          <p className="font-medium">{project.name}</p>
          <p className="text-xs">{project.address}</p>
          <p className="text-xs">
            {project.contractType} · {project.state}
          </p>
        </div>
        <div>
          <h2>Owner</h2>
          <p className="font-medium">{client?.name ?? '—'}</p>
          <p className="text-xs">{client?.address ?? ''}</p>
        </div>
      </section>

      <section className="mb-5">
        <h2>Claims to date</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Date</th>
              <th className="text-right">Gross</th>
              <th className="text-right">Retention</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>#{c.claimNo}</td>
                <td>{c.desc}</td>
                <td>{formatDate(c.date)}</td>
                <td className="text-right tabular-nums">{formatCurrency(c.amount)}</td>
                <td className="text-right tabular-nums">
                  −{formatCurrency(((c.amount || 0) * ratePct) / 100)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Totals</td>
              <td className="text-right tabular-nums">{formatCurrency(totalCertified)}</td>
              <td className="text-right tabular-nums">−{formatCurrency(totalRetained)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mb-5">
        <h2>Balance</h2>
        <table>
          <tbody>
            <tr>
              <td>Retention rate</td>
              <td className="text-right tabular-nums">{ratePct.toFixed(1)}%</td>
            </tr>
            <tr>
              <td>Retention held</td>
              <td className="text-right tabular-nums">{formatCurrency(heldTotal)}</td>
            </tr>
            <tr>
              <td>Retention released</td>
              <td className="text-right tabular-nums">−{formatCurrency(releasedTotal)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Balance to release</td>
              <td className="text-right tabular-nums">{formatCurrency(balance)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-10 pt-6 border-t border-sw-border grid grid-cols-2 gap-6">
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
