import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface StatBlockProps {
  label: string
  value: ReactNode
  sublabel?: string
  /** CSS colour for the number (defaults to ink). Baseline accents: violet money, pink alerts. */
  accent?: string
  /** When set, the whole tile becomes a router link to this path (Phase 4.5-C). */
  to?: string
}

/**
 * Editorial stat block — the baseline KPI pattern: 9px caption, 28px number,
 * 11px sublabel, all over a heavy 2px ink rule. Used on the Dashboard and
 * the Project Overview stat rows. When `to` is set the tile is a drill-through
 * link (subtle hover on the caption signals it's clickable).
 */
export function StatBlock({ label, value, sublabel, accent, to }: StatBlockProps) {
  const inner = (
    <>
      <div className="mb-[7px] text-[9px] font-semibold uppercase tracking-[0.1em] text-sw-dim">
        {label}
      </div>
      <div
        className="mb-[3px] text-[28px] font-bold leading-none tracking-[-0.02em]"
        style={{ color: accent ?? 'var(--sw-ink)' }}
      >
        {value}
      </div>
      {sublabel && <div className="text-[11px] text-sw-dim">{sublabel}</div>}
    </>
  )
  if (to) {
    return (
      <Link
        to={to}
        className="group flex-1 border-b-2 border-sw-ink pb-3.5 [&>div:first-child]:hover:text-sw-ink"
      >
        {inner}
      </Link>
    )
  }
  return <div className="flex-1 border-b-2 border-sw-ink pb-3.5">{inner}</div>
}
