import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '@packages/db'
import { DetailsTab } from '../components/DetailsTab'
import { ResponsibilitiesTab } from '../components/ResponsibilitiesTab'
import { PeopleTab } from '../components/PeopleTab'
import { EssentialsTab } from '../components/EssentialsTab'
import { NotesTab } from '../components/NotesTab'
import { LogsTab } from '../components/LogsTab'

const TABS = ['Home', 'Personal Items List', 'People', 'Responsibilities', 'Notes', 'Logs'] as const
type Tab = typeof TABS[number]

const TAB_META: Record<Tab, { short: string }> = {
  'Home': { short: 'Home' },
  'Personal Items List': { short: 'Items' },
  'People': { short: 'People' },
  'Responsibilities': { short: 'Tasks' },
  'Notes': { short: 'Notes' },
  'Logs': { short: 'Logs' },
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const stroke = active ? 'var(--accent)' : 'var(--text-muted)'
  const props = { width: 22, height: 22, fill: 'none', stroke, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (tab) {
    case 'Home':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2" />
        </svg>
      )
    case 'Personal Items List':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    case 'People':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    case 'Responsibilities':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    case 'Notes':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    case 'Logs':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
  }
}

const STORAGE_KEY = 'camp_planner_name'

export function PlanPage() {
  const { planId } = useParams()
  const [activeTab, setActiveTab] = useState<Tab>('Home')
  const [exists, setExists] = useState<boolean | null>(null)
  const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    document.title = 'Platr'
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
    return <div className="min-h-screen bg-forest flex items-center justify-center text-[var(--text-secondary)]"><div className="stars" />Loading...</div>
  }

  if (!exists) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center text-[var(--text-secondary)] px-4">
        <div className="stars" />
        Plan not found.
      </div>
    )
  }

  if (!userName) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center px-4">
        <div className="stars" />
        <form onSubmit={submitName} className="relative z-10 bg-[var(--bg-card)] p-6 rounded-xl shadow-lg border border-[var(--border)] w-full max-w-sm">
          <h2 className="text-lg font-semibold mb-2 text-center text-[var(--text-primary)]">Welcome to Platr</h2>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-4">Enter your name to join the plan</p>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4"
            autoFocus
          />
          <button type="submit" className="w-full px-4 py-3 bg-[var(--accent)] text-[var(--bg-primary)] font-semibold rounded-lg hover:bg-[var(--accent-hover)] active:brightness-110 text-base">
            Join Plan
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forest flex flex-col">
      <div className="stars" />
      <header className="relative z-10 bg-[var(--bg-secondary)]/80 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg text-[var(--accent)]">Platr</h1>
        <span className="text-sm text-[var(--text-secondary)]">{userName}</span>
      </header>

      <nav className="relative z-10 hidden sm:block border-b border-[var(--border)] bg-[var(--bg-secondary)]/60 backdrop-blur-sm">
        <div className="flex px-2 max-w-2xl mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors min-h-[44px] flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-[var(--accent)] text-[var(--accent)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <TabIcon tab={tab} active={activeTab === tab} />
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="relative z-10 flex-1 p-4 max-w-2xl mx-auto w-full pb-24 sm:pb-8">
        {activeTab === 'Home' && <DetailsTab planId={planId!} userName={userName} />}
        {activeTab === 'Personal Items List' && <EssentialsTab planId={planId!} userName={userName} />}
        {activeTab === 'People' && <PeopleTab planId={planId!} userName={userName} />}
        {activeTab === 'Responsibilities' && <ResponsibilitiesTab planId={planId!} userName={userName} />}
        {activeTab === 'Notes' && <NotesTab planId={planId!} userName={userName} />}
        {activeTab === 'Logs' && <LogsTab planId={planId!} />}
      </main>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)]/95 backdrop-blur-sm border-t border-[var(--border)] safe-bottom z-20">
        <div className="grid grid-cols-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
                activeTab === tab
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] active:text-[var(--text-secondary)]'
              }`}
            >
              <TabIcon tab={tab} active={activeTab === tab} />
              <span className="text-[10px] mt-0.5 font-medium">{TAB_META[tab].short}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
