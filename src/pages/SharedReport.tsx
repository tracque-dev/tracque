import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, FileWarning } from 'lucide-react'
import ReportView, { type ReportData } from '../components/ReportView'

// TRQ-12 — Public, read-only white-label report at /r/:token.
// No auth, no sidebar. Reads ONLY through the shared-report edge function,
// which resolves token → one client server-side. The token is the sole input.

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/functions/v1/shared-report`

export default function SharedReport() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [data, setData] = useState<ReportData | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const json = await res.json()
        if (!cancelled) { setData(json as ReportData); setState('ok') }
      } catch {
        if (!cancelled) setState('error')
      }
    })()
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm mt-3">Loading report…</p>
          </div>
        )}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center"><FileWarning className="w-6 h-6 text-muted-foreground" /></div>
            <h1 className="text-lg font-semibold mt-4">Report not available</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">This share link is invalid or has been disabled. Ask the sender for a new link.</p>
          </div>
        )}
        {state === 'ok' && data && <ReportView data={data} />}
      </div>
    </div>
  )
}
