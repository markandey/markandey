import { useEffect } from 'react'

export default function CampingApp() {
  useEffect(() => {
    document.title = 'Camp Planner'
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <h1 className="font-bold text-xl text-gray-900">Camp Planner</h1>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Hello World</h2>
        <p className="text-gray-500 text-lg">Group camping collaboration app — coming soon.</p>
      </main>
    </div>
  )
}
