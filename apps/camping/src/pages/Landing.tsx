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
    document.title = 'Platr'
  }, [])

  async function createPlan() {
    const id = generateId()
    const { error } = await supabase.from('camping_plans').insert({ id })
    if (!error) {
      navigate(`/camping/${id}`)
    }
  }

  return (
    <div className="min-h-screen bg-forest">
      <div className="stars" />
      <div className="relative z-10 max-w-md mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold text-[var(--accent)] mb-2">Platr</h1>
        <p className="text-[var(--text-secondary)] text-lg mb-2">Plan your next adventure</p>
        <p className="text-[var(--text-muted)] mb-8">Create a camping plan and share the link with your group. Anyone with the link can collaborate.</p>
        <button
          onClick={createPlan}
          className="px-8 py-4 bg-[var(--accent)] text-[var(--bg-primary)] font-semibold rounded-lg hover:bg-[var(--accent-hover)] active:brightness-110 transition-colors text-lg"
        >
          Create New Plan
        </button>
      </div>
    </div>
  )
}
