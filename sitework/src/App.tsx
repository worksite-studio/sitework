import { seed } from '@/state/seed'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate } from '@/lib/formatDate'
import { StatusBadge } from '@/components/StatusBadge'

function App() {
  const projects = seed.projects
  const totalBudget = projects.reduce(
    (sum, p) => sum + p.codes.reduce((s, c) => s + c.budget, 0),
    0,
  )

  return (
    <main className="min-h-screen flex flex-col items-center gap-6 p-10">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">SITEWORK</h1>
        <p className="text-sw-muted text-sm">
          Phase 4 scaffold — Session 2: types, seed, persistence, utilities wired in.
        </p>
      </header>

      <section className="w-full max-w-2xl space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sw-muted">
          Seed sanity check ({projects.length} projects · total budget {formatCurrency(totalBudget)}
          )
        </h2>
        <ul className="border border-sw-border rounded-md divide-y divide-sw-border">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-sw-muted">
                  {p.id} · {p.state} · {formatDate(p.startDate)}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

export default App
