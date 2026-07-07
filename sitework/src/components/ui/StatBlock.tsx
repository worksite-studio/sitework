import type { ReactNode } from 'react'

export interface StatBlockProps {
  label: string
  value: ReactNode
  sublabel?: string
  /** CSS colour for the number (defaults to ink). Baseline accents: violet money, pink alerts. */
  accent?: string
}

/**
 * Editorial stat block — the baseline KPI pattern: 9px caption, 28px number,
 * 11px sublabel, all over a heavy 2px ink rule. Used on the Dashboard and
 * the Project Overview stat rows.
 */
export function StatBlock({ label, value, sublabel, accent }: StatBlockProps) {
  return (
    <div className="flex-1 border-b-2 border-sw-ink pb-3.5">
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
    </div>
  )
}
