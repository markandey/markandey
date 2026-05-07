import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'

interface Essential {
  id: string
  item: string
  brought_by: string
  checked: boolean
}

export function EssentialsTab({ planId, userName }: { planId: string; userName: string }) {
  const [items, setItems] = useState<Essential[]>([])
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBy, setEditBy] = useState('')

  useEffect(() => {
    loadItems()
    const channel = supabase
      .channel(`essentials-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_essentials', filter: `plan_id=eq.${planId}` }, () => loadItems())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadItems() {
    const { data } = await supabase
      .from('camping_essentials')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setItems(data || [])
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    await supabase.from('camping_essentials').insert({
      plan_id: planId,
      item: newItem.trim(),
      brought_by: userName,
    })
    setNewItem('')
  }

  async function toggleItem(item: Essential) {
    await supabase.from('camping_essentials').update({ checked: !item.checked }).eq('id', item.id)
  }

  async function deleteItem(id: string) {
    await supabase.from('camping_essentials').delete().eq('id', id)
  }

  function startEditBy(item: Essential) {
    setEditingId(item.id)
    setEditBy(item.brought_by)
  }

  async function saveEditBy(id: string) {
    if (!editBy.trim()) return
    await supabase.from('camping_essentials').update({ brought_by: editBy.trim() }).eq('id', id)
    setEditingId(null)
    setEditBy('')
  }

  return (
    <div>
      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Item (tent, stove, cooler...)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleItem(item)}
              className="w-4 h-4 accent-green-600"
            />
            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>
              {item.item}
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
            <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No essentials added yet</p>}
    </div>
  )
}
