import { useState } from 'react'
import { Button, Card, EmptyState } from '@/components/ui'
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
          <h2 className="text-lg font-semibold">Defects</h2>
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
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-sw-muted text-left border-b border-sw-border">
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Trade</th>
                <th className="px-3 py-2 font-medium">Logged</th>
                <th className="px-3 py-2 font-medium">Rectified</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {defects.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setEditing(d)}
                  className="border-b border-sw-border last:border-0 cursor-pointer hover:bg-sw-muted/5"
                >
                  <td className="px-3 py-2 text-sw-muted tabular-nums">{d.id}</td>
                  <td className="px-3 py-2">{d.item}</td>
                  <td className="px-3 py-2 text-sw-muted">{d.location}</td>
                  <td className="px-3 py-2 text-sw-muted">{d.trade}</td>
                  <td className="px-3 py-2 text-sw-muted">{formatDate(d.dateLogged)}</td>
                  <td className="px-3 py-2 text-sw-muted">
                    {d.dateRectified ? formatDate(d.dateRectified) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
