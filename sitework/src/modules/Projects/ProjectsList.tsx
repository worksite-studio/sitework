import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '@/state/context'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { ProjectForm } from './ProjectForm'

/**
 * Projects list. Rows navigate into the project; "+ New Project" opens the
 * `I0`-port create dialog (statutory validation included — session P1).
 * Editing lives on the project Overview tab, mirroring legacy.
 */
export function ProjectsList() {
  const { projects } = useAppState()
  const [creating, setCreating] = useState(false)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Button onClick={() => setCreating(true)}>+ New Project</Button>
      </header>
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
      {creating && <ProjectForm open onClose={() => setCreating(false)} />}
    </div>
  )
}
