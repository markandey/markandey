import { Routes, Route, Link } from 'react-router'
import { lazy, Suspense } from 'react'

const CampingApp = lazy(() => import('@apps/camping'))

export function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camping/*" element={<CampingApp />} />
      </Routes>
    </Suspense>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Apps</h1>
          <p className="text-gray-500 mt-1">A collection of mini tools and apps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/camping"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold mb-2">Camp Planner</h2>
            <p className="text-gray-500 text-sm">Plan group camping trips collaboratively</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
