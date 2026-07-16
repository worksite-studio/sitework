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
        className="cursor-pointer bg-transparent p-4 text-[88px] font-bold leading-none tracking-[-0.03em] text-sw-ink transition-opacity hover:opacity-60"
      >
        SITEWORK
      </button>
    </div>
  )
}
