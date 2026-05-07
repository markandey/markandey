import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '@packages/db'
import { EssentialsTab } from '../components/EssentialsTab'
import { SignupTab } from '../components/SignupTab'
import { NotesTab } from '../components/NotesTab'

const TABS = ['Essentials', 'Signup', 'Notes'] as const
type Tab = typeof TABS[number]

export function PlanPage() {
  const { planId } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('Essentials')
  const [exists, setExists] = useState<boolean | null>(null)

  useEffect(() => {
    document.title = 'Camp Planner'
    if (!planId) return
    supabase
      .from('camping_plans')
      .select('id')
      .eq('id', planId)
      .single()
      .then(({ data }) => setExists(!!data))
  }, [planId])

  if (exists === null) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
  }

  if (!exists) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Plan not found.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="font-bold text-lg text-gray-900">Camp Planner</h1>
      </header>

      <div className="flex border-b border-gray-200 bg-white px-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {activeTab === 'Essentials' && <EssentialsTab planId={planId!} />}
        {activeTab === 'Signup' && <SignupTab planId={planId!} />}
        {activeTab === 'Notes' && <NotesTab planId={planId!} />}
      </main>
    </div>
  )
}
