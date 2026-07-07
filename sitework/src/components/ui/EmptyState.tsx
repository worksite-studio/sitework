import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Legacy empty-state: plain faint text, no box, no dashed border. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center p-10 space-y-1">
      <p className="text-[13px] text-sw-faint">{title}</p>
      {description && <p className="text-[12px] text-sw-faint">{description}</p>}
      {action && <div className="pt-3">{action}</div>}
    </div>
  )
}
