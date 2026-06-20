import { useState } from 'react'
import { Globe, Play, Loader2, Download, CheckCircle2, Code2, Tag } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'

interface AuditResult {
  url: string
  business_type?: string
  events: { name: string; trigger: string; element: string; category: string; is_key_event?: boolean }[]
  gtm_container: object
  guide: string
}

export default function SiteAudit() {
  const [url, setUrl] = useState('')
  const [ga4Id, setGa4Id] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runAudit() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('site-audit', {
        body: { url: url.trim(), ga4_id: ga4Id.trim() || 'G-XXXXXXXXXX' },
      })
      if (fnErr) throw new Error(fnErr.message)
      setResult(data)
    } catch (e: any) {
      setError(e.message ?? 'Audit failed')
    } finally {
      setLoading(false)
    }
  }

  function downloadGTM() {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.gtm_container, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'tracque-gtm-container.json'
    a.click()
  }

  const CATEGORY_COLORS: Record<string, string> = {
    conversion: 'bg-emerald-500/10 text-emerald-400',
    engagement: 'bg-primary/10 text-primary',
    navigation: 'bg-muted text-foreground',
    attribution: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-primary">Technical</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight mt-1">Site Audit</h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-generate GA4 events + GTM container for any site</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card rounded-xl border border-border p-5">
        <p className="eyebrow text-muted-foreground mb-4">How it works</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Globe, label: 'Crawl', desc: 'Tracque crawls your site up to 20 pages' },
            { icon: Tag, label: 'Analyze', desc: 'AI identifies every CTA, form, and conversion point' },
            { icon: Code2, label: 'Generate', desc: 'Outputs a complete GA4 event schema' },
            { icon: Download, label: 'Export', desc: 'Download GTM container JSON — import in 30 seconds' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-display font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Website URL</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="https://yoursite.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAudit()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">GA4 Measurement ID (optional)</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background font-mono"
              placeholder="G-XXXXXXXXXX"
              value={ga4Id}
              onChange={e => setGa4Id(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={runAudit}
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Auditing site…</> : <><Play className="w-4 h-4" /> Run audit</>}
        </button>
        {loading && (
          <p className="text-xs text-muted-foreground">Crawling pages and analyzing elements — takes ~30 seconds…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <p className="text-sm font-display font-semibold">
                {result.events.length} events generated
                {result.business_type && <span className="text-muted-foreground font-normal"> · detected: {result.business_type}</span>}
              </p>
            </div>
            <button
              onClick={downloadGTM}
              className="flex items-center gap-2 px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" /> Download GTM container
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="eyebrow text-muted-foreground">GA4 events</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Event name', 'Category', 'Element', 'Trigger'].map(h => (
                    <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.events.map((ev, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm font-mono text-foreground">
                      {ev.is_key_event && <span title="Key event (conversion)" className="text-amber-400 mr-1">★</span>}{ev.name}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${CATEGORY_COLORS[ev.category] ?? 'bg-muted text-foreground'}`}>
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground truncate max-w-[180px]">{ev.element}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{ev.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.guide && (
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="eyebrow text-muted-foreground mb-4">Implementation guide</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{result.guide}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
