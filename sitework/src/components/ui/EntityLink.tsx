import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

/**
 * EntityLink — Phase 4.5-C (linking layer). A consistent inline cross-reference
 * between related records (a cost code → its BOQ line, a client → their
 * projects, a supplier → their invoices). Renders a router `Link` with a subtle
 * dotted underline that solidifies on hover, inheriting the surrounding text
 * colour so it reads as an in-place affordance rather than a loud button.
 *
 * When nested inside a row that is itself clickable (e.g. the BOQ code header),
 * pass `stopPropagation` so the drill-through doesn't also fire the row handler.
 */
export interface EntityLinkProps extends LinkProps {
  /** Stop the click from bubbling to a clickable ancestor (e.g. an expandable row). */
  stopPropagation?: boolean
}

export function EntityLink({ className, stopPropagation, onClick, ...props }: EntityLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation()
        onClick?.(e)
      }}
      className={cn(
        'underline decoration-dotted decoration-sw-rule underline-offset-2 transition-colors hover:decoration-sw-ink hover:text-sw-ink',
        className,
      )}
    />
  )
}
