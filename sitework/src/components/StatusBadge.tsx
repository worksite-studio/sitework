/**
 * StatusBadge — port of legacy `He`: BARE coloured text, 10px/700/uppercase,
 * 0.07em tracking. No pill, no background, no ring — the colour is the badge.
 *
 * Maps known status strings to semantic colour variants. Unknown statuses
 * fall back to neutral muted text so a typo doesn't blow up the page.
 */

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const VARIANT_FOR_STATUS: Record<string, Variant> = {
  // Universal positives — legacy He: pos green
  Paid: 'success',
  Approved: 'success',
  Rectified: 'success',
  Closed: 'success',
  complete: 'success',
  Complete: 'success',
  // Legacy He has no 'Reconciled' entry — it falls to the faint default (R6).
  Reconciled: 'neutral',
  received: 'success',
  approved: 'success',
  won: 'success',
  'On Budget': 'success',

  // Pending / in-motion — legacy He: warn violet
  Pending: 'warning',
  pending: 'warning',
  sent: 'warning',
  quoted: 'warning',
  Ordered: 'warning',
  ordered: 'warning',
  'At Risk': 'warning',
  'on-hold': 'warning',
  Open: 'warning',

  // Live / informational — legacy He: accent ink
  live: 'info',
  'in-progress': 'info',
  InProgress: 'info',
  Issued: 'info',
  Selected: 'info',
  Procured: 'info',
  prospect: 'info',
  tendering: 'info',

  // Neutral
  Draft: 'neutral',
  draft: 'neutral',
  upcoming: 'neutral',

  // Negatives — legacy He: neg pink
  Rejected: 'danger',
  Disputed: 'danger',
  Overdue: 'danger',
  delayed: 'danger',
  declined: 'danger',
  lost: 'danger',
  cancelled: 'danger',
  Over: 'danger',
}

const CLASSES_FOR_VARIANT: Record<Variant, string> = {
  success: 'text-sw-success',
  warning: 'text-sw-warning',
  danger: 'text-sw-danger',
  info: 'text-sw-ink',
  neutral: 'text-sw-muted',
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
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-[0.07em] ${CLASSES_FOR_VARIANT[resolvedVariant]} ${className}`}
    >
      {text}
    </span>
  )
}
