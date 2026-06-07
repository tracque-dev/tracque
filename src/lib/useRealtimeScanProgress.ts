import { useEffect, useState } from 'react'
import { supabase } from '../integrations/supabase/client'

export interface ScanProgress {
  job_id: string
  total: number
  done: number
  failed: number
  pct: number
  status: 'running' | 'completed' | 'failed'
}

export function useRealtimeScanProgress(jobId: string | null) {
  const [progress, setProgress] = useState<ScanProgress | null>(null)

  useEffect(() => {
    if (!jobId) return

    // Load initial state
    supabase
      .from('scan_progress')
      .select('*')
      .eq('job_id', jobId)
      .single()
      .then(({ data }) => { if (data) setProgress(data as ScanProgress) })

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`scan_progress:${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scan_progress', filter: `job_id=eq.${jobId}` },
        (payload) => setProgress(payload.new as ScanProgress)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [jobId])

  return progress
}
