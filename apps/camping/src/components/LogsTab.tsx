import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'

interface LogEntry {
  id: string
  who: string
  what: string
  created_at: string
}

const PAGE_SIZE = 20

export function LogsTab({ planId }: { planId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadLogs()
    const channel = supabase
      .channel(`logs-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_logs', filter: `plan_id=eq.${planId}` }, () => loadLogs())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  useEffect(() => {
    loadLogs()
  }, [visibleCount])

  async function loadLogs() {
    const { count } = await supabase
      .from('camping_logs')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', planId)
    setTotalCount(count || 0)

    const { data } = await supabase
      .from('camping_logs')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
      .range(0, visibleCount - 1)
    setLogs(data || [])
    setLoading(false)
  }

  const hasMore = totalCount > visibleCount

  if (loading) return <div className="text-[var(--text-muted)] text-sm py-8 text-center">Loading...</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activity Log</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">A timeline of everything that's happened on this plan.</p>
      {logs.length === 0 ? (
        <p className="text-[var(--text-muted)] text-sm text-center py-8">No activity yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 font-medium text-[var(--text-muted)] w-8">#</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--text-muted)]">Who</th>
                <th className="text-left py-2 px-3 font-medium text-[var(--text-muted)]">What</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id} className="border-b border-[var(--border)]/50">
                  <td className="py-2 px-3 text-[var(--text-muted)] text-xs">{totalCount - idx}</td>
                  <td className="py-2 px-3 font-medium text-[var(--accent)]">{log.who}</td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">{log.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-4 w-full py-2 text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--bg-card)]"
        >
          Load more
        </button>
      )}
    </div>
  )
}
