import type { ReactNode } from 'react'
import { Card } from './Card'
import { cn } from '@/lib/cn'

export interface KpiTileProps {
  label: string
  value: ReactNode
  sublabel?: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
}

const TONE: Record<NonNullable<KpiTileProps['tone']>, string> = {
  neutral: 'text-sw-text',
  success: 'text-sw-success',
  warning: 'text-sw-warning',
  danger: 'text-sw-danger',
}

/**
 * Headline KPI card used on the Dashboard. Three rows: small label,
 * the big number, and a smaller descriptor line.
 */
export function KpiTile({ label, value, sublabel, tone = 'neutral' }: KpiTileProps) {
  return (
    <Card className="p-4 space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-sw-muted">{label}</div>
      <div className={cn('text-2xl font-semibold tracking-tight', TONE[tone])}>{value}</div>
      {sublabel && <div className="text-xs text-sw-muted">{sublabel}</div>}
    </Card>
  )
}
