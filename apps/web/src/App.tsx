import { Routes, Route, Link } from 'react-router'
import { useAuth } from '@packages/auth'
import { lazy, Suspense } from 'react'
import { LoginPage } from './pages/Login'

const CampingApp = lazy(() => import('@apps/camping'))

export function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl text-gray-900">Apps</Link>
          <Link to="/camping" className="text-gray-600 hover:text-gray-900">Camp Planner</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<div>Loading app...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/camping/*" element={<CampingApp />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Link
        to="/camping"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
      >
        <h2 className="text-lg font-semibold mb-2">Camp Planner</h2>
        <p className="text-gray-500 text-sm">Plan group camping trips collaboratively</p>
      </Link>
    </div>
  )
}
