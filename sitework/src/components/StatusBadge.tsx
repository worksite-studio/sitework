/**
 * StatusBadge — coloured status chip, port of the legacy `He` component.
 *
 * Maps known status strings to semantic colour variants. Unknown statuses
 * fall back to a neutral grey chip so a typo doesn't blow up the page.
 */

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const VARIANT_FOR_STATUS: Record<string, Variant> = {
  // Universal positives
  Paid: 'success',
  Approved: 'success',
  Rectified: 'success',
  Closed: 'success',
  complete: 'success',
  Complete: 'success',
  Reconciled: 'success',
  received: 'success',
  approved: 'success',
  won: 'success',

  // In-progress / informational
  Pending: 'warning',
  pending: 'warning',
  Issued: 'info',
  Draft: 'neutral',
  draft: 'neutral',
  Selected: 'info',
  Procured: 'info',
  InProgress: 'info',
  'in-progress': 'info',
  upcoming: 'info',
  sent: 'info',
  prospect: 'info',
  tendering: 'info',
  live: 'success',
  quoted: 'info',

  // Negatives
  Rejected: 'danger',
  Disputed: 'danger',
  Open: 'warning',
  Overdue: 'danger',
  delayed: 'danger',
  declined: 'danger',
  lost: 'danger',
  cancelled: 'danger',
  'on-hold': 'warning',
}

const CLASSES_FOR_VARIANT: Record<Variant, string> = {
  success: 'bg-sw-success/10 text-sw-success ring-sw-success/20',
  warning: 'bg-sw-warning/10 text-sw-warning ring-sw-warning/30',
  danger: 'bg-sw-danger/10 text-sw-danger ring-sw-danger/30',
  info: 'bg-sw-info/10 text-sw-info ring-sw-info/20',
  neutral: 'bg-sw-muted/10 text-sw-muted ring-sw-muted/20',
}

export interface StatusBadgeProps {
  /** Status string (matched case-sensitively against the variant map). */
  status: string
  /** Override the displayed text (defaults to the status string upper-cased). */
  label?: string
  /** Override the colour variant (skips the map lookup). */
  variant?: Variant
  className?: string
}

export function StatusBadge({ status, label, variant, className = '' }: StatusBadgeProps) {
  const resolvedVariant: Variant = variant ?? VARIANT_FOR_STATUS[status] ?? 'neutral'
  const text = label ?? status.toUpperCase()
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CLASSES_FOR_VARIANT[resolvedVariant]} ${className}`}
    >
      {text}
    </span>
  )
}
