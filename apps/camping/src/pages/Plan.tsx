import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '@packages/db'
import { DetailsTab } from '../components/DetailsTab'
import { ResponsibilitiesTab } from '../components/ResponsibilitiesTab'
import { PeopleTab } from '../components/PeopleTab'
import { EssentialsTab } from '../components/EssentialsTab'
import { NotesTab } from '../components/NotesTab'
import { LogsTab } from '../components/LogsTab'

const TABS = ['Details', 'Responsibilities', 'People', 'Essentials', 'Notes', 'Logs'] as const
type Tab = typeof TABS[number]

const STORAGE_KEY = 'camp_planner_name'

export function PlanPage() {
  const { planId } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('Details')
  const [exists, setExists] = useState<boolean | null>(null)
  const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [nameInput, setNameInput] = useState('')

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

  function submitName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameInput.trim()) return
    const name = nameInput.trim()
    localStorage.setItem(STORAGE_KEY, name)
    setUserName(name)
  }

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

  if (!userName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <form onSubmit={submitName} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-4 text-center">What's your name?</h2>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 mb-4"
            autoFocus
          />
          <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700">
            Join Plan
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg text-gray-900">Camp Planner</h1>
        <span className="text-sm text-gray-500">{userName}</span>
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
        {activeTab === 'Details' && <DetailsTab planId={planId!} userName={userName} />}
        {activeTab === 'Responsibilities' && <ResponsibilitiesTab planId={planId!} userName={userName} />}
        {activeTab === 'People' && <PeopleTab planId={planId!} userName={userName} />}
        {activeTab === 'Essentials' && <EssentialsTab planId={planId!} userName={userName} />}
        {activeTab === 'Notes' && <NotesTab planId={planId!} userName={userName} />}
        {activeTab === 'Logs' && <LogsTab planId={planId!} />}
      </main>
    </div>
  )
}
