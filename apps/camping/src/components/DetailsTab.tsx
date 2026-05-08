import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const html = lines.map(line => {
    if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold mt-4 mb-1 text-[var(--text-primary)]">${escapeAndFormat(line.slice(4))}</h3>`
    if (line.startsWith('## ')) return `<h2 class="text-xl font-semibold mt-4 mb-1 text-[var(--text-primary)]">${escapeAndFormat(line.slice(3))}</h2>`
    if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold mt-4 mb-2 text-[var(--text-primary)]">${escapeAndFormat(line.slice(2))}</h1>`
    if (line.startsWith('- ')) return `<li class="ml-4 list-disc text-sm text-[var(--text-primary)]">${escapeAndFormat(line.slice(2))}</li>`
    if (line.trim() === '') return '<br/>'
    return `<p class="text-sm text-[var(--text-primary)] leading-relaxed">${escapeAndFormat(line)}</p>`
  }).join('')
  return html
}

function escapeAndFormat(text: string) {
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-[var(--accent)] underline hover:text-[var(--accent-hover)]">$1</a>')
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
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

  if (loading) return <div className="text-[var(--text-muted)] text-sm py-8 text-center">Loading...</div>

  if (editing) {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full h-80 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm font-mono text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)] resize-y"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-2 bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)]">
            Save
          </button>
          <button onClick={() => { setEditing(false); setDraft(content) }} className="px-4 py-2 text-[var(--text-secondary)] text-sm rounded-lg hover:bg-[var(--bg-card)]">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={() => setEditing(true)} className="px-3 py-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] rounded">
          Edit page
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    </div>
  )
}
