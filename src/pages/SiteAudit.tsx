import { useState } from 'react'
import { Globe, Play, Loader2, Download, CheckCircle2, Code2, Tag } from 'lucide-react'
import { supabase } from '../integrations/supabase/client'

interface AuditResult {
  url: string
  events: { name: string; trigger: string; element: string; category: string }[]
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
    conversion: 'bg-emerald-50 text-emerald-700',
    engagement: 'bg-blue-50 text-blue-700',
    navigation: 'bg-violet-50 text-violet-700',
    attribution: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Globe className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Site Audit</h1>
          <p className="text-xs text-muted-foreground">Auto-generate GA4 events + GTM container for any site</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">How it works</p>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Globe, label: 'Crawl', desc: 'Tracque crawls your site up to 20 pages' },
            { icon: Tag, label: 'Analyze', desc: 'AI identifies every CTA, form, and conversion point' },
            { icon: Code2, label: 'Generate', desc: 'Outputs a complete GA4 event schema' },
            { icon: Download, label: 'Export', desc: 'Download GTM container JSON — import in 30 seconds' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Website URL</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background"
              placeholder="https://yoursite.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAudit()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">GA4 Measurement ID (optional)</label>
            <input
              className="w-full text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary bg-background font-mono"
              placeholder="G-XXXXXXXXXX"
              value={ga4Id}
              onChange={e => setGa4Id(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={runAudit}
          disabled={loading || !url.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Auditing site…</> : <><Play className="w-3.5 h-3.5" /> Run Audit</>}
        </button>
        {loading && (
          <p className="text-xs text-muted-foreground">Crawling pages and analyzing elements — takes ~30 seconds…</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-semibold">Audit complete — {result.events.length} events generated</p>
            </div>
            <button
              onClick={downloadGTM}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download GTM Container
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">GA4 Events</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Event name', 'Category', 'Element', 'Trigger'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.events.map((ev, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 text-xs font-mono text-foreground">{ev.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ev.category] ?? 'bg-muted text-muted-foreground'}`}>
                        {ev.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[180px]">{ev.element}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{ev.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.guide && (
            <div className="bg-card rounded-xl border border-border p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Implementation Guide</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{result.guide}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
