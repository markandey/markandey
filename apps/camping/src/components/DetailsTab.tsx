import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const html = lines.map(line => {
    // Headings
    if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold mt-4 mb-1">${escapeAndFormat(line.slice(4))}</h3>`
    if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mt-4 mb-1">${escapeAndFormat(line.slice(3))}</h2>`
    if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mt-4 mb-2">${escapeAndFormat(line.slice(2))}</h1>`
    // List items
    if (line.startsWith('- ')) return `<li class="ml-4 list-disc text-sm text-gray-700">${escapeAndFormat(line.slice(2))}</li>`
    // Empty line
    if (line.trim() === '') return '<br/>'
    // Paragraph
    return `<p class="text-sm text-gray-700 leading-relaxed">${escapeAndFormat(line)}</p>`
  }).join('')
  return html
}

function escapeAndFormat(text: string) {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 underline hover:text-blue-800">$1</a>')
  // Bold: **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Italic: *text*
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return s
}

const DEFAULT_CONTENT = `# Camping Trip

## Details
- **Where:** TBD
- **When:** TBD
- **Meeting point:** TBD

## What to bring
Check the Essentials tab for the shared gear list.

## Notes
Add notes in the Notes tab to coordinate with the group.
`

export function DetailsTab({ planId, userName }: { planId: string; userName: string }) {
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
    const channel = supabase
      .channel(`plan-details-${planId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'camping_plans', filter: `id=eq.${planId}` }, () => loadContent())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadContent() {
    const { data } = await supabase
      .from('camping_plans')
      .select('content')
      .eq('id', planId)
      .single()
    const c = data?.content || DEFAULT_CONTENT
    setContent(c)
    setDraft(c)
    setLoading(false)
  }

  async function save() {
    await supabase.from('camping_plans').update({ content: draft }).eq('id', planId)
    addLog(planId, userName, 'Edited the Details page')
    setContent(draft)
    setEditing(false)
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full h-80 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-green-500 resize-y"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
            Save
          </button>
          <button onClick={() => { setEditing(false); setDraft(content) }} className="px-4 py-2 text-gray-500 text-sm rounded-lg hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={() => setEditing(true)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
          Edit page
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    </div>
  )
}
