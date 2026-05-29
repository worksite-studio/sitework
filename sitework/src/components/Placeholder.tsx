/**
 * Stub page used until each module is ported (Sessions 5–10). Shows the
 * module name + a "ported in a later session" note so navigation is fully
 * walkable now without every screen being built.
 */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-sw-muted">
        {note ?? 'This module is ported in a later Phase 4 session.'}
      </p>
    </div>
  )
}
