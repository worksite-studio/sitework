import type { ReactNode } from 'react'

/**
 * List-page header — baseline pattern: 26px/700/-0.02em title with the
 * primary action button right-aligned, 24px below.
 */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-[26px] font-bold tracking-[-0.02em] text-sw-ink">{title}</h1>
      {action}
    </div>
  )
}
