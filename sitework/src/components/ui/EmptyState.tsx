import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * Standard "nothing here yet" panel. Matches the legacy empty-state pattern
 * added in session 17 (after the cross-cutting-polish lesson in WORKFLOW §8).
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6 space-y-2 border border-dashed border-sw-border rounded-md bg-sw-surface">
      <p className="text-sm font-medium text-sw-text">{title}</p>
      {description && <p className="text-xs text-sw-muted">{description}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  )
}
