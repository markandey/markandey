import { Routes, Route, Link, Navigate } from 'react-router'
import { useAuth } from '@packages/auth'
import { lazy, Suspense } from 'react'
import { LoginPage } from './pages/Login'

const CampingApp = lazy(() => import('@apps/camping'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  const { user, loading, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl text-gray-900">Markandey Apps</Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-500">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={<div>Loading app...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/camping/*" element={
              <RequireAuth>
                <CampingApp />
              </RequireAuth>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function HomePage() {
  return (
    <div>
      <div className="mb-8">
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
  )
}
