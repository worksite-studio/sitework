import { Link } from 'react-router-dom'
import { useAppState } from '@/state/context'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/lib/formatCurrency'

/**
 * Minimal Projects list — enough to navigate into a project (so routing into
 * project tabs is testable now). The full-fidelity port with filters and the
 * contract-vs-cost summary lands in Sessions 5–7.
 */
export function ProjectsList() {
  const { projects } = useAppState()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <ul className="border border-sw-border rounded-md divide-y divide-sw-border bg-sw-surface">
        {projects.map((p) => {
          const budget = p.codes.reduce((s, c) => s + c.budget, 0)
          return (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}/overview`}
                className="flex items-center justify-between px-4 py-3 hover:bg-sw-muted/5 transition"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-sw-muted">
                    {p.id} · {p.state} · {p.contractType} · budget {formatCurrency(budget)}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
