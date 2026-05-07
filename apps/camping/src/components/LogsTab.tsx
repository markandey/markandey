import { useEffect, useState } from 'react'
import { supabase } from '@packages/db'

interface LogEntry {
  id: string
  who: string
  what: string
  created_at: string
}

export function LogsTab({ planId }: { planId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
    const channel = supabase
      .channel(`logs-${planId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camping_logs', filter: `plan_id=eq.${planId}` }, () => loadLogs())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function loadLogs() {
    const { data } = await supabase
      .from('camping_logs')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  if (loading) return <div className="text-gray-400 text-sm py-8 text-center">Loading...</div>

  return (
    <div>
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
    </div>
  )
}
