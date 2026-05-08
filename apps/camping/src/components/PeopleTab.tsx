import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

interface Signup {
  id: string
  name: string
  created_at: string
}

interface TreeNode {
  label: string
  signups: Signup[]
  children: Map<string, TreeNode>
}

function buildTree(signups: Signup[]): TreeNode {
  const root: TreeNode = { label: '', signups: [], children: new Map() }

  for (const s of signups) {
    const parts = s.name.split(':').map((p) => p.trim())
    if (parts.length === 1) {
      root.signups.push(s)
    } else {
      let node = root
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]
        if (!node.children.has(key)) {
          node.children.set(key, { label: key, signups: [], children: new Map() })
        }
        node = node.children.get(key)!
      }
      node.signups.push({ ...s, name: parts[parts.length - 1] })
    }
  }
  return root
}

function countPeople(signups: Signup[]): number {
  return signups.length
}

export function PeopleTab({ planId, userName }: { planId: string; userName: string }) {
  const [signups, setSignups] = useState<Signup[]>([])
  const [name, setName] = useState(userName)

  useEffect(() => {
    loadSignups()
    const channel = supabase
      .channel(`signups-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_signups', filter: `plan_id=eq.${planId}` }, () => {
        loadSignups()
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
    const trimmedName = name.trim()
    const optimistic: Signup = {
      id: `optimistic-${Date.now()}`,
      name: trimmedName,
      created_at: new Date().toISOString(),
    }
    setSignups((prev) => [...prev, optimistic])
    setName('')
    await supabase.from('camping_signups').insert({
      plan_id: planId,
      name: trimmedName,
    })
    addLog(planId, trimmedName, 'Joined the trip')
    loadSignups()
  }

  async function removeSignup(id: string) {
    const person = signups.find((s) => s.id === id)
    setSignups((prev) => prev.filter((s) => s.id !== id))
    await supabase.from('camping_signups').delete().eq('id', id)
    if (person) addLog(planId, userName, `Removed ${person.name} from the trip`)
  }

  const tree = buildTree(signups)

  function countNode(node: TreeNode): number {
    let total = node.signups.length
    for (const child of node.children.values()) {
      total += countNode(child)
    }
    return total
  }

  function renderNode(node: TreeNode, depth: number = 0) {
    return (
      <>
        {node.signups.map((s) => (
          <div key={s.id} className={`flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200`} style={{ marginLeft: `${depth * 1.25}rem` }}>
            <span className="text-sm font-medium">{s.name}</span>
            {!s.id.startsWith('optimistic-') ? (
              <button onClick={() => removeSignup(s.id)} className="text-red-400 hover:text-red-600 active:text-red-800 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            ) : (
              <span className="text-gray-300 text-xs min-h-[44px] flex items-center">saving...</span>
            )}
          </div>
        ))}
        {Array.from(node.children.values()).map((child) => (
          <div key={child.label} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-1 mt-2" style={{ marginLeft: `${depth * 1.25}rem` }}>
              {child.label} <span className="text-xs font-normal text-gray-400">({countNode(child)})</span>
            </h3>
            {renderNode(child, depth + 1)}
          </div>
        ))}
      </>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">People</h2>
      <p className="text-sm text-gray-500 mb-4">Who's coming? Use colons to group people (e.g. "veg:markandey" or "family:markandey:agastya" for nested groups).</p>
      <form onSubmit={addSignup} className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name or group:subgroup:name"
          className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
        />
        <button type="submit" className="px-4 py-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 active:bg-green-800 min-h-[44px]">
          I'm in!
        </button>
      </form>

      <div className="space-y-2">
        {renderNode(tree)}
      </div>
      {signups.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No one signed up yet</p>}
      {signups.length > 0 && <p className="text-gray-400 text-xs mt-4">{signups.length} going</p>}
    </div>
  )
}
