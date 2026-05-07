import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@packages/db'

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

export function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Camp Planner'
  }, [])

  async function createPlan() {
    const id = generateId()
    const { error } = await supabase.from('camping_plans').insert({ id })
    if (!error) {
      navigate(`/camping/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Camp Planner</h1>
        <p className="text-gray-500 mb-8">Create a camping plan and share the link with your group. Anyone with the link can collaborate.</p>
        <button
          onClick={createPlan}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Create New Plan
        </button>
      </div>
    </div>
  )
}
