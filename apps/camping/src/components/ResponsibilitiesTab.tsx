import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

interface Essential {
  id: string
  item: string
  brought_by: string
  checked: boolean
}

interface GroupedItem {
  category: string
  items: Essential[]
}

function groupItems(items: Essential[]): GroupedItem[] {
  const groups: Map<string, Essential[]> = new Map()
  const ungrouped: Essential[] = []

  for (const item of items) {
    const colonIdx = item.item.indexOf(':')
    if (colonIdx > 0) {
      const category = item.item.slice(0, colonIdx).trim()
      if (!groups.has(category)) groups.set(category, [])
      groups.get(category)!.push(item)
    } else {
      ungrouped.push(item)
    }
  }

  const result: GroupedItem[] = []
  for (const [category, categoryItems] of groups) {
    result.push({ category, items: categoryItems })
  }
  if (ungrouped.length > 0) {
    result.push({ category: '', items: ungrouped })
  }
  return result
}

export function ResponsibilitiesTab({ planId, userName }: { planId: string; userName: string }) {
  const [items, setItems] = useState<Essential[]>([])
  const [newItem, setNewItem] = useState('')
  const [assignTo, setAssignTo] = useState(userName)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBy, setEditBy] = useState('')
  const [people, setPeople] = useState<string[]>([])

  useEffect(() => {
    loadItems()
    loadPeople()
    const channel = supabase
      .channel(`essentials-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_essentials', filter: `plan_id=eq.${planId}` }, () => {
        loadItems()
      })
      .subscribe()
    const signupsChannel = supabase
      .channel(`signups-resp-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_signups', filter: `plan_id=eq.${planId}` }, () => {
        loadPeople()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(signupsChannel)
    }
  }, [planId])

  async function loadItems() {
    const { data } = await supabase
      .from('camping_essentials')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setItems(data || [])
  }

  async function loadPeople() {
    const { data } = await supabase
      .from('camping_signups')
      .select('name')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    const names = (data || []).map((s) => s.name)
    setPeople(names)
  }

  const assignOptions = Array.from(new Set([userName, ...people]))

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    const trimmedItem = newItem.trim()
    const optimistic: Essential = {
      id: `optimistic-${Date.now()}`,
      item: trimmedItem,
      brought_by: assignTo,
      checked: false,
    }
    setItems((prev) => [...prev, optimistic])
    setNewItem('')
    await supabase.from('camping_essentials').insert({
      plan_id: planId,
      item: trimmedItem,
      brought_by: assignTo,
    })
    addLog(planId, userName, `Added responsibility: ${trimmedItem}`)
    loadItems()
  }

  async function toggleItem(item: Essential) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, checked: !i.checked } : i))
    await supabase.from('camping_essentials').update({ checked: !item.checked }).eq('id', item.id)
  }

  async function deleteItem(id: string) {
    const item = items.find((i) => i.id === id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    await supabase.from('camping_essentials').delete().eq('id', id)
    if (item) addLog(planId, userName, `Removed responsibility: ${item.item}`)
  }

  function startEditBy(item: Essential) {
    setEditingId(item.id)
    setEditBy(item.brought_by)
  }

  async function saveEditBy(id: string) {
    if (!editBy.trim()) return
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, brought_by: editBy.trim() } : i))
    await supabase.from('camping_essentials').update({ brought_by: editBy.trim() }).eq('id', id)
    setEditingId(null)
    setEditBy('')
  }

  const grouped = groupItems(items)

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Responsibilities</h2>
      <p className="text-sm text-gray-500 mb-4">Assign tasks and track who's handling what. Use "Category: task" format to group items (e.g. "Food: bring cooler").</p>
      <form onSubmit={addItem} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Task or Category: task"
          className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
        />
        <div className="flex gap-2">
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:ring-2 focus:ring-green-500 bg-white min-h-[44px]"
          >
            {assignOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button type="submit" className="px-4 py-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 active:bg-green-800 min-h-[44px] min-w-[44px]">
            Add
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.category || '__ungrouped'}>
            {group.category && (
              <h3 className="text-sm font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">{group.category}</h3>
            )}
            <ul className="space-y-2">
              {group.items.map((item) => {
                const displayName = item.item.includes(':') ? item.item.split(':').slice(1).join(':').trim() : item.item
                return (
                  <li key={item.id} className={`flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200 ${group.category ? 'ml-4' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item)}
                      className="w-5 h-5 accent-green-600 min-w-[20px]"
                    />
                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>
                      {displayName}
                    </span>
                    {editingId === item.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          value={editBy}
                          onChange={(e) => setEditBy(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && saveEditBy(item.id)}
                        />
                        <button onClick={() => saveEditBy(item.id)} className="text-green-600 text-xs">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditBy(item)}
                        className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
                      >
                        {item.brought_by}
                      </button>
                    )}
                    {!item.id.startsWith('optimistic-') ? (
                      <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 active:text-red-800 text-sm min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                    ) : (
                      <span className="text-gray-300 text-xs min-h-[44px] flex items-center">saving...</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No responsibilities added yet</p>}
    </div>
  )
}
