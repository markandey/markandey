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

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">Activity Log</h2>
      <p className="text-sm text-gray-500 mb-4">A timeline of everything that's happened on this plan.</p>
      {logs.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">No activity yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500">Who</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">What</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100">
                  <td className="py-2 px-3 font-medium text-green-700">{log.who}</td>
                  <td className="py-2 px-3 text-gray-700">{log.what}</td>
                  <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
