import { supabase } from '@packages/db'

export async function addLog(planId: string, who: string, what: string) {
  await supabase.from('camping_logs').insert({ plan_id: planId, who, what })
}
