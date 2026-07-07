import { NavLink, Outlet, useParams, Link } from 'react-router-dom'
import { PROJECT_TABS } from '@/nav'
import { useAppState } from '@/state/context'
import type { ProjectId } from '@/types'

/**
 * Per-project shell — port of the legacy 44px project sub-bar (inside `Pc`):
 * project name over client at the left behind a rule divider, then the tab
 * strip (10px uppercase, active = ink + 2px underline), "All Projects" at the
 * far right. The active tab renders into <Outlet /> inside the page padding.
 */
export function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { projects, clients } = useAppState()
  const project = projects.find((p) => p.id === (projectId as ProjectId))

  if (!project) {
    return (
      <div className="sw-page space-y-2">
        <p className="text-sm text-sw-muted">Project not found.</p>
        <Link to="/projects" className="text-sm text-sw-ink hover:underline">
          ← All Projects
        </Link>
      </div>
    )
  }

  const client = clients.find((c) => c.id === project.clientId)

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex h-11 shrink-0 items-center border-b border-sw-rule bg-white px-10">
        <div className="mr-6 pr-6 border-r border-sw-rule shrink-0">
          <div className="text-[11px] font-semibold leading-tight text-sw-ink">{project.name}</div>
          <div className="text-[9px] leading-tight text-sw-dim">
            {client?.name ?? 'Unknown client'}
          </div>
        </div>
        <nav className="flex h-11 flex-1 items-center overflow-x-auto whitespace-nowrap">
          {PROJECT_TABS.map((tab) => (
            <NavLink
              key={tab.id}
              to={`/projects/${project.id}/${tab.id}`}
              className={({ isActive }) =>
                `flex h-11 shrink-0 items-center px-3 text-[10px] border-b-2 transition ${
                  isActive
                    ? 'font-semibold text-sw-ink border-sw-ink'
                    : 'font-normal text-sw-dim border-transparent hover:text-sw-mid'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/projects"
          className="ml-2 shrink-0 border-l border-sw-rule pl-3.5 text-[10px] text-sw-dim hover:text-sw-mid"
        >
          All Projects
        </Link>
      </div>

      <div className="sw-page flex-1">
        <Outlet context={{ projectId: project.id }} />
      </div>
    </div>
  )
}
