import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

interface Signup {
  id: string
  name: string
  created_at: string
}

export function PeopleTab({ planId, userName }: { planId: string; userName: string }) {
  const [signups, setSignups] = useState<Signup[]>([])
  const [optimisticSignups, setOptimisticSignups] = useState<Signup[]>([])
  const [name, setName] = useState(userName)

  useEffect(() => {
    loadSignups()
    const channel = supabase
      .channel(`signups-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_signups', filter: `plan_id=eq.${planId}` }, () => {
        loadSignups()
        setOptimisticSignups([])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadSignups() {
    const { data } = await supabase
      .from('camping_signups')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setSignups(data || [])
  }

  async function addSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const optimistic: Signup = {
      id: `optimistic-${Date.now()}`,
      name: name.trim(),
      created_at: new Date().toISOString(),
    }
    setOptimisticSignups((prev) => [...prev, optimistic])
    const trimmedName = name.trim()
    setName('')
    await supabase.from('camping_signups').insert({
      plan_id: planId,
      name: trimmedName,
    })
    addLog(planId, trimmedName, 'Joined the trip')
  }

  async function removeSignup(id: string) {
    await supabase.from('camping_signups').delete().eq('id', id)
  }

  const allSignups = [...signups, ...optimisticSignups]

  return (
    <div>
      <form onSubmit={addSignup} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          I'm in!
        </button>
      </form>

      <div className="space-y-2">
        {allSignups.map((s) => (
          <div key={s.id} className={`flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 ${s.id.startsWith('optimistic-') ? 'opacity-70' : ''}`}>
            <span className="text-sm font-medium">{s.name}</span>
            {!s.id.startsWith('optimistic-') && (
              <button onClick={() => removeSignup(s.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            )}
          </div>
        ))}
      </div>
      {allSignups.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No one signed up yet</p>}
      {allSignups.length > 0 && <p className="text-gray-400 text-xs mt-4">{allSignups.length} going</p>}
    </div>
  )
}
