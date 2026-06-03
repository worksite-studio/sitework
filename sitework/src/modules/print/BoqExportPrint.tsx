import { useParams } from 'react-router-dom'
import { PrintLayout } from './PrintLayout'
import { useAppState } from '@/state/context'
import { formatCurrency } from '@/lib/formatCurrency'
import type { ProjectId } from '@/types'

/**
 * BOQ Export — cost codes with budget / variations / adjusted / actual /
 * overrun for the printed contract administration trail.
 */
export function BoqExportPrint() {
  const { projectId } = useParams<{ projectId: string }>()
  const state = useAppState()
  const project = state.projects.find((p) => p.id === (projectId as ProjectId))

  if (!project) {
    return (
      <PrintLayout title="BOQ — not found" backTo="/" autoPrint={false}>
        <p>Project not found.</p>
      </PrintLayout>
    )
  }

  const rows = project.codes
  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + (r.budget || 0),
      vars: acc.vars + (r.vars || 0),
      actual: acc.actual + (r.actual || 0),
    }),
    { budget: 0, vars: 0, actual: 0 },
  )
  const adj = totals.budget + totals.vars
  const overrun = totals.actual - adj

  return (
    <PrintLayout title="BOQ export" backTo={`/projects/${project.id}/boq`}>
      <header className="flex items-start justify-between gap-6 mb-5">
        <div>
          <h1>{project.name}</h1>
          <p className="text-xs text-sw-muted">
            BOQ & Budget · {project.contractType} · {project.state} · {project.codes.length} codes
          </p>
        </div>
        <div className="text-right text-xs text-sw-muted">
          Generated {new Date().toLocaleDateString('en-AU')}
        </div>
      </header>

      <section>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th className="text-right">Orig. budget</th>
              <th className="text-right">Variations</th>
              <th className="text-right">Adj. budget</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Overrun</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const rowAdj = (c.budget || 0) + (c.vars || 0)
              const rowOver = (c.actual || 0) - rowAdj
              return (
                <tr key={c.id}>
                  <td className="tabular-nums">{c.code}</td>
                  <td>{c.desc}</td>
                  <td className="text-right tabular-nums">{formatCurrency(c.budget || 0)}</td>
                  <td className="text-right tabular-nums">
                    {c.vars ? formatCurrency(c.vars) : '—'}
                  </td>
                  <td className="text-right tabular-nums">{formatCurrency(rowAdj)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(c.actual || 0)}</td>
                  <td className="text-right tabular-nums">
                    {rowOver > 0 ? `+${formatCurrency(rowOver)}` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Totals</td>
              <td className="text-right tabular-nums">{formatCurrency(totals.budget)}</td>
              <td className="text-right tabular-nums">
                {totals.vars ? formatCurrency(totals.vars) : '—'}
              </td>
              <td className="text-right tabular-nums">{formatCurrency(adj)}</td>
              <td className="text-right tabular-nums">{formatCurrency(totals.actual)}</td>
              <td className="text-right tabular-nums">
                {overrun > 0 ? `+${formatCurrency(overrun)}` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>
    </PrintLayout>
  )
}
