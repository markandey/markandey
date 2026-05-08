import { Routes, Route, Link } from 'react-router'
import { lazy, Suspense } from 'react'

const CampingApp = lazy(() => import('@apps/camping'))

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-forest flex items-center justify-center text-[var(--text-secondary)]"><div className="stars" />Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camping/*" element={<CampingApp />} />
      </Routes>
    </Suspense>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen bg-forest">
      <div className="stars" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--accent)]">Platr</h1>
          <p className="text-[var(--text-secondary)] mt-1">A collection of mini tools and apps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/camping"
            className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card-hover)] transition-all"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Camp Planner</h2>
            <p className="text-[var(--text-secondary)] text-sm">Plan group camping trips collaboratively</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
