/**
 * Certificate / insurance expiry status helpers. Shared by the Subcontractors
 * module (cert chips on rows + in the form), the Dashboard Compliance Alerts
 * tile, and (later) the project Calendar tab.
 */

const DAY_MS = 24 * 60 * 60 * 1000
export const WARN_WINDOW_DAYS = 30

export type ExpiryStatus = 'expired' | 'expiring' | 'current' | 'unknown'

export interface ExpiryInfo {
  status: ExpiryStatus
  /** Negative when expired, positive when in the future. `null` for unknown. */
  daysUntil: number | null
}

export function getExpiryInfo(
  iso: string | null | undefined,
  today: Date = new Date(),
): ExpiryInfo {
  if (!iso) return { status: 'unknown', daysUntil: null }
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return { status: 'unknown', daysUntil: null }
  const days = Math.round((t - today.getTime()) / DAY_MS)
  if (days < 0) return { status: 'expired', daysUntil: days }
  if (days <= WARN_WINDOW_DAYS) return { status: 'expiring', daysUntil: days }
  return { status: 'current', daysUntil: days }
}

export function expiryLabel(info: ExpiryInfo): string {
  switch (info.status) {
    case 'expired':
      return `Expired ${Math.abs(info.daysUntil!)}d ago`
    case 'expiring':
      return info.daysUntil === 0 ? 'Expires today' : `Expires in ${info.daysUntil}d`
    case 'current':
      return `Current (${info.daysUntil}d)`
    case 'unknown':
      return 'No date'
  }
}
