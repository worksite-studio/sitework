/**
 * Splash — white screen with an 18px lilac pixel-dot grid and the SITEWORK
 * wordmark. Only the wordmark is clickable (it's the single control that
 * enters the app); the rest of the screen is inert. Shows on every full page
 * load; tests and screenshot tooling skip it via sessionStorage['sw:skipSplash']
 * (see `splashGate.ts`).
 */
export function Splash({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none bg-white"
      style={{
        backgroundImage: 'radial-gradient(rgba(139,92,246,0.22) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      <button
        type="button"
        onClick={onEnter}
        aria-label="Enter SITEWORK"
        className="group flex cursor-pointer flex-col items-center bg-transparent p-4"
      >
        <span className="text-[88px] font-bold leading-none tracking-[-0.03em] text-sw-ink transition-opacity group-hover:opacity-60">
          SITEWORK
        </span>
        <span
          className="mt-[26px] text-[12px] font-medium uppercase tracking-[0.18em] transition-colors group-hover:text-sw-ink"
          style={{ color: '#9CA3AF' }}
        >
          Enter
        </span>
      </button>
    </div>
  )
}
