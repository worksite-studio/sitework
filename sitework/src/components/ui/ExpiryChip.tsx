import { getExpiryInfo, type ExpiryStatus } from '@/lib/certExpiry'
import { cn } from '@/lib/cn'

/**
 * Cert / insurance expiry chip — legacy pill treatment: mono 10px, rounded,
 * pink fill when expired, literal amber (#F59E0B — the baseline uses amber
 * here even though its warn token is violet) when ≤30d, bare muted text
 * otherwise.
 */
const TONE: Record<ExpiryStatus, string> = {
  current: 'text-sw-muted',
  expiring: 'bg-[#F59E0B] text-white',
  expired: 'bg-sw-neg text-white',
  unknown: 'text-sw-faint',
}

const LABEL: Record<ExpiryStatus, string> = {
  current: 'Current',
  expiring: '≤30d',
  expired: 'Expired',
  unknown: '—',
}

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
        'inline-flex items-center font-mono rounded-full px-2 py-[3px] text-[10px] font-semibold',
        TONE[info.status],
        className,
      )}
    >
      {kind ? `${kind} ` : ''}
      {LABEL[info.status]}
    </span>
  )
}
