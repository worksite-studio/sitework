import { getExpiryInfo, type ExpiryStatus } from '@/lib/certExpiry'
import { cn } from '@/lib/cn'

const TONE: Record<ExpiryStatus, string> = {
  current: 'bg-sw-success/10 text-sw-success ring-sw-success/20',
  expiring: 'bg-sw-warning/10 text-sw-warning ring-sw-warning/30',
  expired: 'bg-sw-danger/10 text-sw-danger ring-sw-danger/30',
  unknown: 'bg-sw-muted/10 text-sw-muted ring-sw-muted/20',
}

const LABEL: Record<ExpiryStatus, string> = {
  current: 'Current',
  expiring: '≤30d',
  expired: 'Expired',
  unknown: '—',
}

/**
 * Coloured chip for a cert / insurance expiry date. Pass the ISO date string;
 * the chip reads its own clock so consumers don't have to thread `today`.
 *
 * Optionally prefix with a `kind` label (e.g. "PL", "WC") so a row with
 * multiple chips reads at a glance.
 */
export function ExpiryChip({
  iso,
  kind,
  today,
  className,
}: {
  iso: string | null | undefined
  kind?: string
  today?: Date
  className?: string
}) {
  const info = getExpiryInfo(iso, today)
  return (
    <span
      title={iso || 'No expiry on file'}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE[info.status],
        className,
      )}
    >
      {kind ? `${kind} ` : ''}
      {LABEL[info.status]}
    </span>
  )
}
