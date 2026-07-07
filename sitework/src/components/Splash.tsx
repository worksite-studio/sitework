/**
 * Splash — verbatim port of legacy `Lp`: white screen with an 18px lilac
 * pixel-dot grid, the SITEWORK wordmark at 88px, and "Tap anywhere to enter".
 * Shows on every full page load (exact legacy `Ap` behaviour — React state,
 * no storage flag). Tests and screenshot tooling skip it via
 * sessionStorage['sw:skipSplash'].
 */
export function Splash({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      onClick={onEnter}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none bg-white"
      style={{
        backgroundImage: 'radial-gradient(rgba(139,92,246,0.22) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      <div className="text-[88px] font-bold leading-none tracking-[-0.03em] text-sw-ink">
        SITEWORK
      </div>
      <div
        className="mt-[26px] text-[12px] font-medium uppercase tracking-[0.18em]"
        style={{ color: '#9CA3AF' }}
      >
        Tap anywhere to enter
      </div>
    </div>
  )
}
