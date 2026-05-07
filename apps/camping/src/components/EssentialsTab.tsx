import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'

const DEFAULT_CONTENT = `# Personal Essentials

## Clothing
- Hiking boots
- Rain jacket
- Warm layers
- Hat / sunglasses

## Sleeping
- Sleeping bag
- Sleeping pad
- Pillow

## Food & Water
- Water bottle
- Snacks
- Cooking utensils

## Safety
- First aid kit
- Flashlight / headlamp
- Sunscreen
- Bug spray

## Other
- Phone charger
- Camera
- Book
`

export function EssentialsTab({ planId }: { planId: string }) {
  const [content, setContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
    const channel = supabase
      .channel(`essentials-md-${planId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'camping_plans', filter: `id=eq.${planId}` }, () => loadContent())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadContent() {
    const { data } = await supabase
      .from('camping_plans')
      .select('essentials_content')
      .eq('id', planId)
      .single()
    const c = data?.essentials_content || DEFAULT_CONTENT
    setContent(c)
    setDraft(c)
    setLoading(false)
  }

  async function save() {
    await supabase.from('camping_plans').update({ essentials_content: draft }).eq('id', planId)
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
      <div className="prose-sm">
        {content.split('\n').map((line, i) => {
          if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-4 mb-1">{line.slice(3)}</h2>
          if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
          if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-sm text-gray-700">{line.slice(2)}</li>
          if (line.trim() === '') return <br key={i} />
          return <p key={i} className="text-sm text-gray-700">{line}</p>
        })}
      </div>
    </div>
  )
}
