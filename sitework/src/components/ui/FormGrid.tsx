import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Port of legacy `Ot` — the standard 2-column form grid (16px col / 12px row gap). */
export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-x-4 gap-y-3 mb-5', className)}>{children}</div>
}
