import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Boxed panel — matches the legacy OpenBook report card (6px radius, rule
 * border). The baseline barely uses boxes: most surfaces are ruled sections,
 * so Card appears only where the legacy app genuinely draws one.
 */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md border border-sw-rule bg-white', className)} {...rest} />
}
