function App() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-semibold tracking-tight">SITEWORK</h1>
      <p className="text-sw-muted text-sm">
        Phase 4 scaffold — Vite + React 19 + TypeScript + Tailwind v4.
      </p>
      <button
        type="button"
        className="px-4 py-2 rounded-md bg-sw-primary text-white text-sm font-medium hover:opacity-90 transition"
        onClick={() => alert('Scaffold is wired up.')}
      >
        Verify HMR
      </button>
    </main>
  )
}

export default App
