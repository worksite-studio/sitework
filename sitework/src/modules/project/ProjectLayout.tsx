import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { PROJECT_TABS } from '@/nav'
import { useAppState } from '@/state/context'
import type { ProjectId } from '@/types'

/**
 * Per-project shell — the tab bar + project header. Renders the active tab
 * into <Outlet />. Port of the legacy project view chrome (the `m` tab array
 * driven section inside `Pc`).
 */
export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, clients } = useAppState()
  const project = projects.find((p) => p.id === (projectId as ProjectId))

  if (!project) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-sw-muted">Project not found.</p>
        <Link to="/projects" className="text-sm text-sw-info hover:underline">
          ← All projects
        </Link>
      </div>
    )
  }

  const client = clients.find((c) => c.id === project.clientId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-sm text-sw-muted hover:text-sw-text">
          ← All Projects
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-sm text-sw-muted">
          {client?.name ?? 'Unknown client'} · {project.address}
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-sw-border pb-2">
        {PROJECT_TABS.map((tab) => (
          <NavLink
            key={tab.id}
            to={`/projects/${project.id}/${tab.id}`}
            className={({ isActive }) =>
              `rounded-md px-3 py-1.5 text-sm transition ${
                isActive ? 'bg-sw-primary text-white' : 'text-sw-text hover:bg-sw-muted/10'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ projectId: project.id }} />
    </div>
  )
}
