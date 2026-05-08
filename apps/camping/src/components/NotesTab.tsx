import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

interface Note {
  id: string
  text: string
  author: string
  created_at: string
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const PAGE_SIZE = 20

export function NotesTab({ planId, userName }: { planId: string; userName: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadNotes()
    const channel = supabase
      .channel(`notes-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_notes', filter: `plan_id=eq.${planId}` }, () => {
        loadNotes()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadNotes() {
    const { count } = await supabase
      .from('camping_notes')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId)
    setTotalCount(count || 0)

    const { data } = await supabase
      .from('camping_notes')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
      .range(0, visibleCount - 1)
    setNotes(data || [])
  }

  useEffect(() => {
    loadNotes()
  }, [visibleCount])

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newNote.trim()) return
    const text = newNote.trim()
    const optimistic: Note = {
      id: `optimistic-${Date.now()}`,
      text,
      author: userName,
      created_at: new Date().toISOString(),
    }
    setNotes((prev) => [optimistic, ...prev])
    setNewNote('')
    await supabase.from('camping_notes').insert({
      plan_id: planId,
      text,
      author: userName,
    })
    addLog(planId, userName, `Added note: ${text.slice(0, 50)}`)
  }

  async function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('camping_notes').delete().eq('id', id)
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    await supabase.from('camping_notes').update({ text: editText.trim() }).eq('id', id)
    setEditingId(null)
    setEditText('')
  }

  function startEdit(note: Note) {
    setEditingId(note.id)
    setEditText(note.text)
  }

  const hasMore = totalCount > visibleCount

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Notes</h2>
      <p className="text-sm text-gray-500 mb-4">Share quick updates, ideas, or reminders with the group.</p>
      <form onSubmit={addNote} className="flex gap-2 mb-4">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
          maxLength={280}
        />
        <button type="submit" className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="bg-white p-3 rounded-lg border border-gray-200">
            {editingId === note.id ? (
              <div className="flex gap-2">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={280}
                  autoFocus
                />
                <button onClick={() => saveEdit(note.id)} className="text-green-600 text-sm font-medium">Save</button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">Cancel</button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1">
                  <span className="font-medium text-green-700">{note.author}</span>
                  <span className="text-gray-400 text-xs ml-1">{formatRelativeTime(note.created_at)}</span>
                  <span className="text-green-700">: </span>
                  {note.text}
                </p>
                {!note.id.startsWith('optimistic-') && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(note)} className="text-gray-400 hover:text-gray-600 text-xs">Edit</button>
                    <button onClick={() => deleteNote(note.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {notes.length === 0 && <p className="text-gray-400 text-sm text-center py-8">No notes yet</p>}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Load more
        </button>
      )}
    </div>
  )
}
