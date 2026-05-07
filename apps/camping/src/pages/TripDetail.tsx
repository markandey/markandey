import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { supabase } from '@packages/db'
import { useAuth } from '@packages/auth'
import { Button, Input, Card } from '@packages/ui'

interface Trip {
  id: string
  name: string
  location: string
  start_date: string
  end_date: string
  created_by: string
}

interface ChecklistItem {
  id: string
  trip_id: string
  text: string
  assigned_to: string | null
  completed: boolean
  created_by: string
}

interface Member {
  id: string
  trip_id: string
  user_id: string
  email: string
  role: 'owner' | 'member'
}

export function TripDetail() {
  const { tripId } = useParams()
  const { user } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newItem, setNewItem] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    if (!tripId) return
    loadTrip()
    loadItems()
    loadMembers()

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items', filter: `trip_id=eq.${tripId}` }, () => {
        loadItems()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` }, () => {
        loadMembers()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tripId])

  async function loadTrip() {
    const { data } = await supabase.from('trips').select('*').eq('id', tripId).single()
    setTrip(data)
  }

  async function loadItems() {
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
    setItems(data || [])
  }

  async function loadMembers() {
    const { data } = await supabase
      .from('trip_members')
      .select('*')
      .eq('trip_id', tripId)
    setMembers(data || [])
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    await supabase.from('checklist_items').insert({
      trip_id: tripId,
      text: newItem,
      created_by: user!.id,
    })
    setNewItem('')
  }

  async function toggleItem(item: ChecklistItem) {
    await supabase
      .from('checklist_items')
      .update({ completed: !item.completed })
      .eq('id', item.id)
  }

  async function deleteItem(id: string) {
    await supabase.from('checklist_items').delete().eq('id', id)
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    await supabase.from('trip_members').insert({
      trip_id: tripId,
      email: inviteEmail,
      role: 'member',
      user_id: null,
    })
    setInviteEmail('')
  }

  if (!trip) return <div>Loading...</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{trip.name}</h1>
        <p className="text-gray-500">{trip.location}</p>
        <p className="text-gray-400 text-sm">
          {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <h2 className="font-semibold mb-4">Checklist</h2>
            <form onSubmit={addItem} className="flex gap-2 mb-4">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item (tent, food, firewood...)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit">Add</Button>
            </form>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItem(item)}
                    className="w-4 h-4"
                  />
                  <span className={item.completed ? 'line-through text-gray-400 flex-1' : 'flex-1'}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            {items.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No items yet</p>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h2 className="font-semibold mb-4">Members</h2>
            <ul className="space-y-2 mb-4">
              {members.map((m) => (
                <li key={m.id} className="text-sm text-gray-600">
                  {m.email} {m.role === 'owner' && <span className="text-xs text-blue-500">(owner)</span>}
                </li>
              ))}
            </ul>
            <form onSubmit={inviteMember} className="flex flex-col gap-2">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invite by email"
                type="email"
                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button type="submit">Invite</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
