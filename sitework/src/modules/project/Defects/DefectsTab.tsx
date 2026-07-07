import { useState } from 'react'
import { Button, EmptyState } from '@/components/ui'
import { StatusBadge } from '@/components/StatusBadge'
import { formatDate } from '@/lib/formatDate'
import { useAppState } from '@/state/context'
import { useProject } from '../useProject'
import { DefectForm } from './DefectForm'
import type { Defect } from '@/types'

export function DefectsTab() {
  const project = useProject()
  const state = useAppState()
  const [editing, setEditing] = useState<Defect | null>(null)
  const [creating, setCreating] = useState(false)

  if (!project) return null
  const defects = state.defects[project.id as string] ?? []
  const open = defects.filter((d) => d.status === 'Open').length

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.01em]">Defects</h2>
          <p className="text-xs text-sw-muted">
            {open} open · {defects.length - open} closed
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New Defect</Button>
      </header>

      {defects.length === 0 ? (
        <EmptyState
          title="No defects yet"
          description="Log defects against this project to track rectification."
          action={<Button onClick={() => setCreating(true)}>+ New Defect</Button>}
        />
      ) : (
        <div>
          <table className="sw-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Location</th>
                <th>Trade</th>
                <th>Logged</th>
                <th>Rectified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {defects.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setEditing(d)}
                  className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                >
                  <td className="text-sw-muted font-mono">{d.id}</td>
                  <td>{d.item}</td>
                  <td className="text-sw-muted">{d.location}</td>
                  <td className="text-sw-muted">{d.trade}</td>
                  <td className="text-sw-muted">{formatDate(d.dateLogged)}</td>
                  <td className="text-sw-muted">
                    {d.dateRectified ? formatDate(d.dateRectified) : '—'}
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DefectForm open={creating} onClose={() => setCreating(false)} projectId={project.id} />
      {editing && (
        <DefectForm
          open
          onClose={() => setEditing(null)}
          projectId={project.id}
          initial={editing}
        />
      )}
    </div>
  )
}
