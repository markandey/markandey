import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'
import { addLog } from '../utils/log'

interface Essential {
  id: string
  item: string
  brought_by: string
  checked: boolean
}

interface Like {
  item_id: string
  user_name: string
}

interface TreeNode {
  label: string
  items: Essential[]
  children: Map<string, TreeNode>
}

function buildTree(items: Essential[]): TreeNode {
  const root: TreeNode = { label: '', items: [], children: new Map() }

  for (const item of items) {
    const parts = item.item.split(':').map((p) => p.trim())
    if (parts.length === 1) {
      root.items.push(item)
    } else {
      let node = root
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i]
        if (!node.children.has(key)) {
          node.children.set(key, { label: key, items: [], children: new Map() })
        }
        node = node.children.get(key)!
      }
      node.items.push(item)
    }
  }
  return root
}

export function ResponsibilitiesTab({ planId, userName }: { planId: string; userName: string }) {
  const [items, setItems] = useState<Essential[]>([])
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBy, setEditBy] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemText, setEditItemText] = useState('')
  const [people, setPeople] = useState<string[]>([])
  const [likes, setLikes] = useState<Like[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadItems()
    loadPeople()
    loadLikes()
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
    const likesChannel = supabase
      .channel(`likes-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_likes' }, () => {
        loadLikes()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(signupsChannel)
      supabase.removeChannel(likesChannel)
    }
  }, [planId])

  async function loadItems() {
    const { data } = await supabase
      .from('camping_essentials')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setItems(data || [])
    loadLikes()
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

  async function loadLikes() {
    const itemIds = items.map((i) => i.id).filter((id) => !id.startsWith('optimistic-'))
    if (itemIds.length === 0) {
      const { data } = await supabase.from('camping_likes').select('item_id, user_name')
      setLikes(data || [])
      return
    }
    const { data } = await supabase.from('camping_likes').select('item_id, user_name').in('item_id', itemIds)
    setLikes(data || [])
  }

  async function toggleLike(itemId: string) {
    const existing = likes.find((l) => l.item_id === itemId && l.user_name === userName)
    if (existing) {
      setLikes((prev) => prev.filter((l) => !(l.item_id === itemId && l.user_name === userName)))
      await supabase.from('camping_likes').delete().eq('item_id', itemId).eq('user_name', userName)
    } else {
      setLikes((prev) => [...prev, { item_id: itemId, user_name: userName }])
      await supabase.from('camping_likes').insert({ item_id: itemId, user_name: userName })
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    const lines = newItem.split('\n').map((l) => l.trim()).filter(Boolean)
    await bulkAdd(lines)
  }

  async function bulkAdd(lines: string[]) {
    if (lines.length === 0) return
    const optimistics = lines.map((line, i) => ({
      id: `optimistic-${Date.now()}-${i}`,
      item: line,
      brought_by: '',
      checked: false,
    }))
    setItems((prev) => [...prev, ...optimistics])
    setNewItem('')
    await supabase.from('camping_essentials').insert(
      lines.map((line) => ({ plan_id: planId, item: line, brought_by: '' }))
    )
    addLog(planId, userName, lines.length === 1 ? `Added responsibility: ${lines[0]}` : `Added ${lines.length} responsibilities`)
    loadItems()
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text')
    if (text.includes('\n')) {
      e.preventDefault()
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      bulkAdd(lines)
    }
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

  function startEditItem(item: Essential) {
    setEditingItemId(item.id)
    setEditItemText(item.item)
  }

  async function saveEditItem(id: string) {
    if (!editItemText.trim()) return
    const trimmed = editItemText.trim()
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, item: trimmed } : i))
    await supabase.from('camping_essentials').update({ item: trimmed }).eq('id', id)
    setEditingItemId(null)
    setEditItemText('')
    addLog(planId, userName, `Edited responsibility: ${trimmed}`)
  }

  async function claimItem(item: Essential) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, brought_by: userName } : i))
    await supabase.from('camping_essentials').update({ brought_by: userName }).eq('id', item.id)
    addLog(planId, userName, `Claimed responsibility: ${item.item}`)
  }

  async function unclaimItem(item: Essential) {
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, brought_by: '' } : i))
    await supabase.from('camping_essentials').update({ brought_by: '' }).eq('id', item.id)
    addLog(planId, userName, `Unclaimed responsibility: ${item.item}`)
  }

  function getAllLeafItems(node: TreeNode): Essential[] {
    const result = [...node.items]
    for (const child of node.children.values()) {
      result.push(...getAllLeafItems(child))
    }
    return result
  }

  async function claimGroup(node: TreeNode) {
    const leafItems = getAllLeafItems(node).filter((i) => !i.id.startsWith('optimistic-'))
    const ids = leafItems.map((i) => i.id)
    setItems((prev) => prev.map((i) => ids.includes(i.id) ? { ...i, brought_by: userName } : i))
    await supabase.from('camping_essentials').update({ brought_by: userName }).in('id', ids)
    addLog(planId, userName, `Claimed group: ${node.label} (${leafItems.length} items)`)
  }

  async function unclaimGroup(node: TreeNode) {
    const leafItems = getAllLeafItems(node).filter((i) => !i.id.startsWith('optimistic-') && i.brought_by === userName)
    const ids = leafItems.map((i) => i.id)
    setItems((prev) => prev.map((i) => ids.includes(i.id) ? { ...i, brought_by: '' } : i))
    await supabase.from('camping_essentials').update({ brought_by: '' }).in('id', ids)
    addLog(planId, userName, `Unclaimed group: ${node.label}`)
  }

  function toggleExpanded(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const tree = buildTree(items)

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Responsibilities</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">Assign tasks and track who's handling what. Use "Category: task" format to group items (e.g. "Food: bring cooler").</p>
      <form onSubmit={addItem} className="flex gap-2 mb-4">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onPaste={handlePaste}
          placeholder="Task or Category: task (paste multiple lines to bulk add)"
          className="flex-1 px-3 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[44px]"
        />
        <button type="submit" className="px-4 py-3 bg-[var(--accent)] text-[var(--bg-primary)] text-sm font-semibold rounded-lg hover:bg-[var(--accent-hover)] active:brightness-110 min-h-[44px] min-w-[44px]">
          Add
        </button>
      </form>

      <div className="space-y-2">
        {renderNode(tree, 0, '')}
      </div>
      {items.length === 0 && <p className="text-[var(--text-muted)] text-sm text-center py-8">No responsibilities added yet</p>}
    </div>
  )

  function getAllItemIds(node: TreeNode): string[] {
    const ids = node.items.map((i) => i.id)
    for (const child of node.children.values()) {
      ids.push(...getAllItemIds(child))
    }
    return ids
  }

  function getGroupLikeCount(node: TreeNode): number {
    const allIds = getAllItemIds(node)
    const uniquePeople = new Set<string>()
    for (const l of likes) {
      if (allIds.includes(l.item_id)) {
        uniquePeople.add(l.user_name)
      }
    }
    return uniquePeople.size
  }

  function hasUserLikedGroup(node: TreeNode): boolean {
    const allIds = getAllItemIds(node)
    return likes.some((l) => allIds.includes(l.item_id) && l.user_name === userName)
  }

  function renderNode(node: TreeNode, depth: number, path: string) {
    return (
      <>
        {node.items.map((item) => {
          const parts = item.item.split(':')
          const displayName = parts[parts.length - 1].trim()
          return (
            <li key={item.id} className="flex items-center gap-3 bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)] list-none" style={{ marginLeft: `${depth * 1.25}rem` }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item)}
                className="w-5 h-5 accent-green-600 min-w-[20px]"
              />
              <div className="flex-1 min-w-0">
                {editingItemId === item.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={editItemText}
                      onChange={(e) => setEditItemText(e.target.value)}
                      className="flex-1 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditItem(item.id)
                        if (e.key === 'Escape') setEditingItemId(null)
                      }}
                    />
                    <button onClick={() => saveEditItem(item.id)} className="text-[var(--accent)] text-xs font-medium shrink-0">Save</button>
                    <button onClick={() => setEditingItemId(null)} className="text-[var(--text-muted)] text-xs shrink-0">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditItem(item)}
                    className={`text-sm text-left w-full truncate ${item.checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)] hover:text-[var(--accent)]'}`}
                  >
                    {displayName}
                  </button>
                )}
              </div>
              {editingItemId !== item.id && (
              <div className="flex items-center gap-1 shrink-0">
                {!item.id.startsWith('optimistic-') && (() => {
                  const likeCount = likes.filter((l) => l.item_id === item.id).length
                  const liked = likes.some((l) => l.item_id === item.id && l.user_name === userName)
                  return (
                    <button
                      onClick={() => toggleLike(item.id)}
                      className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium min-h-[32px] transition-colors ${
                        liked ? 'bg-pink-900/30 text-pink-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
                  )
                })()}
                {editingId === item.id ? (
                  <div className="flex gap-1 items-center">
                    <input
                      value={editBy}
                      onChange={(e) => setEditBy(e.target.value)}
                      className="w-20 px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveEditBy(item.id)}
                    />
                    <button onClick={() => saveEditBy(item.id)} className="text-[var(--accent)] text-xs">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-[var(--text-muted)] text-xs">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditBy(item)}
                    className={`text-xs hover:underline min-h-[32px] flex items-center ${item.brought_by ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : 'text-amber-400 italic'}`}
                  >
                    {item.brought_by || 'unassigned'}
                  </button>
                )}
                {!item.id.startsWith('optimistic-') ? (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      ···
                    </button>
                    {menuOpenId === item.id && (
                      <div className="absolute right-0 top-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                        {item.brought_by === userName ? (
                          <button
                            onClick={() => { unclaimItem(item); setMenuOpenId(null) }}
                            className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-[var(--bg-card)]"
                          >
                            Unclaim
                          </button>
                        ) : (
                          <button
                            onClick={() => { claimItem(item); setMenuOpenId(null) }}
                            className="w-full text-left px-3 py-2 text-xs text-[var(--accent)] hover:bg-[var(--bg-card)]"
                          >
                            Claim (Mine)
                          </button>
                        )}
                        <button
                          onClick={() => { deleteItem(item.id); setMenuOpenId(null) }}
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-[var(--bg-card)]"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)] text-xs min-h-[44px] flex items-center">saving...</span>
                )}
              </div>
              )}
            </li>
          )
        })}
        {Array.from(node.children.values()).map((child) => {
          const childPath = path ? `${path}/${child.label}` : child.label
          const isCollapsible = depth >= 1
          const isExpanded = !isCollapsible || expanded.has(childPath)
          const leafCount = getAllLeafItems(child).length
          const allClaimedByMe = getAllLeafItems(child).every((i) => i.brought_by === userName)
          return (
            <div key={child.label} className="space-y-2">
              <h3
                className="text-sm font-semibold text-[var(--accent)] border-b border-[var(--border)] pb-1 mt-2 flex items-center gap-2"
                style={{ marginLeft: `${depth * 1.25}rem` }}
              >
                {isCollapsible && (
                  <button
                    onClick={() => toggleExpanded(childPath)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center w-5 h-5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
                <span>{child.label}</span>
                <span className="text-xs font-normal text-[var(--text-muted)]">({leafCount})</span>
                {(() => {
                  const count = getGroupLikeCount(child)
                  const liked = hasUserLikedGroup(child)
                  return count > 0 ? (
                    <span className={`text-xs font-normal px-1.5 py-0.5 rounded ${liked ? 'bg-pink-900/30 text-pink-400' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                      <svg className="inline w-3 h-3 mr-0.5 -mt-0.5" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      {count}
                    </span>
                  ) : null
                })()}
                {isCollapsible && !isExpanded && (
                  <button
                    onClick={() => allClaimedByMe ? unclaimGroup(child) : claimGroup(child)}
                    className={`ml-auto text-xs px-2 py-0.5 rounded ${allClaimedByMe ? 'text-red-400 hover:bg-red-900/20' : 'text-[var(--accent)] hover:bg-[var(--accent)]/10'}`}
                  >
                    {allClaimedByMe ? 'Unclaim all' : 'Claim all'}
                  </button>
                )}
              </h3>
              {isExpanded && (
                <>
                  {renderNode(child, depth + 1, childPath)}
                  <button
                    onClick={() => {
                      const prefix = childPath.replace(/\//g, ':')
                      bulkAdd([`${prefix}:new item`])
                    }}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] py-2 px-3 rounded hover:bg-[var(--bg-card)] transition-colors"
                    style={{ marginLeft: `${(depth + 1) * 1.25}rem` }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add item
                  </button>
                </>
              )}
            </div>
          )
        })}
      </>
    )
  }
}
