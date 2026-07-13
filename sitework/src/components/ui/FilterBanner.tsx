/**
 * FilterBanner — Phase 4.5-C (linking layer). The dismissible strip shown when
 * a list is narrowed by a drill-through query param (`?cc=`, `?sup=`,
 * `?client=`). Reads "Filtered by {label}: {value}" with a clear ✕ that drops
 * the param and restores the full list. Render-time only — the filter lives in
 * the URL, never in persisted state.
 */
export interface FilterBannerProps {
  label: string
  value: string
  onClear: () => void
}

export function FilterBanner({ label, value, onClear }: FilterBannerProps) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-[1px] bg-sw-bg px-3 py-2 text-[12px] text-sw-dim">
      <span>
        Filtered by {label}: <strong className="text-sw-ink">{value}</strong>
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto cursor-pointer bg-transparent p-0 text-[11px] font-medium text-sw-dim hover:text-sw-ink"
      >
        Clear ✕
      </button>
    </div>
  )
}
