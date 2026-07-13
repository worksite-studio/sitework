import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppState } from '@/state/context'
import { StatusBadge } from '@/components/StatusBadge'
import { Button, FilterBanner } from '@/components/ui'
import { formatCurrency } from '@/lib/formatCurrency'
import { ProjectForm } from './ProjectForm'

type Filter = 'live' | 'quoted' | 'all'

/** Legacy `Ma` — committed vs budget health colour. */
function healthColor(budget: number, committed: number): string {
  if (!budget) return 'var(--sw-faint)'
  if (committed <= budget) return 'var(--sw-pos)'
  if (committed <= budget * 1.1) return 'var(--sw-violet)'
  return 'var(--sw-neg)'
}

/**
 * Projects list — baseline layout: Live/Quoted/All filter chips, health-dot
 * rows (name over client · address) with the committed spend in mono at the
 * right over "of $X budget". "+ New Project" opens the `I0`-port create
 * dialog (statutory validation included — session P1).
 */
export function ProjectsList() {
  const { projects, clients } = useAppState()
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('live')
  const [searchParams, setSearchParams] = useSearchParams()

  // Drill-through filter (Phase 4.5-C): ?client from a Clients-page row. When
  // present it overrides the Live/Quoted/All chip so every matching project is
  // shown regardless of status. Render-time only — the filter lives in the URL.
  const clientFilter = searchParams.get('client')
  const clientFilterName = clientFilter
    ? clients.find((c) => (c.id as string) === clientFilter)?.name
    : null

  const shown = clientFilter
    ? projects.filter((p) => (p.clientId as string) === clientFilter)
    : projects.filter((p) =>
        filter === 'all' ? true : filter === 'live' ? p.status === 'live' : p.status === 'quoted',
      )

  return (
    <div className="sw-page">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">Projects</h1>
        <Button onClick={() => setCreating(true)}>+ New Project</Button>
      </header>

      {clientFilter ? (
        <FilterBanner
          label="client"
          value={clientFilterName ?? clientFilter}
          onClear={() => {
            const next = new URLSearchParams(searchParams)
            next.delete('client')
            setSearchParams(next, { replace: true })
          }}
        />
      ) : (
        <div className="mb-7 flex gap-1.5">
          {(
            [
              ['live', 'Live'],
              ['quoted', 'Quoted'],
              ['all', 'All'],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`border px-3.5 py-1.5 text-[12px] font-medium cursor-pointer rounded-[1px] ${
                filter === key
                  ? 'bg-sw-ink text-white border-sw-ink'
                  : 'bg-white text-sw-ink border-sw-rule'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <ul>
        {shown.map((p) => {
          const budget = p.codes.reduce((s, c) => s + c.budget, 0)
          const committed = p.codes.reduce((s, c) => s + c.committed, 0)
          const client = clients.find((c) => c.id === p.clientId)
          const color = healthColor(budget, committed)
          return (
            <li key={p.id} className="border-b border-sw-rule-l">
              <Link
                to={`/projects/${p.id}/overview`}
                className="flex items-center gap-4 py-4 transition hover:bg-sw-bg-subtle"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-sw-ink">{p.name}</span>
                  <span className="block text-[12px] text-sw-dim">
                    {client?.name}
                    {client?.name && p.address ? ' · ' : ''}
                    {p.address}
                  </span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block font-mono text-[15px] font-semibold" style={{ color }}>
                    {formatCurrency(committed)}
                  </span>
                  <span className="block text-[11px] text-sw-faint">
                    of {formatCurrency(budget)} budget
                  </span>
                </span>
                <StatusBadge status={p.status} className="shrink-0" />
              </Link>
            </li>
          )
        })}
        {shown.length === 0 && (
          <li className="p-10 text-center text-[13px] text-sw-faint">
            No {filter === 'all' ? '' : filter + ' '}projects.
          </li>
        )}
      </ul>

      {creating && <ProjectForm open onClose={() => setCreating(false)} />}
    </div>
  )
}
