import { useState, useMemo } from 'react'
import { LayoutGrid, Loader2, Play, Check, X, Trophy } from 'lucide-react'
import { useBrands, useKeywords, useSaivResults, useRunSaivScan } from '../lib/hooks'

export default function Saiv() {
  const { data: brands = [] } = useBrands()
  const { data: keywords = [] } = useKeywords()
  const { data: rows = [], isLoading } = useSaivResults()
  const runScan = useRunSaivScan()

  const ownBrand = brands.find(b => b.type === 'own') ?? brands[0]
  const [prompts, setPrompts] = useState('')

  // Pre-fill from tracked keywords on first load.
  const seeded = useMemo(() => keywords.slice(0, 8).map(k => k.phrase).join('\n'), [keywords])
  const promptText = prompts || seeded

  const total = rows.length
  const mentioned = rows.filter(r => r.mentioned).length
  const saiv = total ? Math.round((mentioned / total) * 100) : 0
  const positions = rows.filter(r => r.mentioned && r.position).map(r => r.position as number)
  const avgPos = positions.length ? (positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : null

  // Who's recommended instead of you, aggregated.
  const rivalCounts = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach(r => (r.competitors ?? []).forEach(c => m.set(c, (m.get(c) ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [rows])

  function run() {
    if (!ownBrand) return
    const list = promptText.split('\n').map(s => s.trim()).filter(Boolean)
    if (list.length) runScan.mutate({ brand_id: ownBrand.id, prompts: list })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><LayoutGrid className="w-4 h-4 text-blue-600" /></div>
        <div>
          <h1 className="text-xl font-semibold">Share of AI Voice</h1>
          <p className="text-xs text-muted-foreground">Across real buyer prompts — are you recommended, and who shows up instead?</p>
        </div>
      </div>

      {/* Prompt input */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card space-y-3">
        <label className="text-xs font-medium text-muted-foreground">Prompts to test (one per line, up to 12)</label>
        <textarea value={promptText} onChange={e => setPrompts(e.target.value)} rows={4}
          placeholder={"best project management software\nnotion alternatives\ntools for product teams"}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background font-mono" />
        <div className="flex items-center gap-3">
          <button onClick={run} disabled={runScan.isPending || !ownBrand}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {runScan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runScan.isPending ? 'Scanning AI…' : 'Run AI-voice scan'}
          </button>
          {runScan.isPending && <span className="text-xs text-muted-foreground">Querying ChatGPT per prompt — ~5s each…</span>}
          {!ownBrand && <span className="text-xs text-muted-foreground">Add a brand (type: own) first.</span>}
        </div>
      </div>

      {/* Score */}
      {total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Share of AI Voice</p>
            <p className="text-3xl font-bold nums">{saiv}%</p>
            <p className="text-xs text-muted-foreground mt-1">recommended in {mentioned}/{total} prompts</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Avg position</p>
            <p className="text-3xl font-bold nums">{avgPos ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">when recommended</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Prompts tested</p>
            <p className="text-3xl font-bold nums">{total}</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : total === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
          <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No AI-voice data yet</p>
          <p className="text-xs mt-1">Add prompts your buyers actually ask AI, then run a scan.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Prompt', 'Recommended?', 'Position', 'Who shows up'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors align-top">
                  <td className="px-4 py-3 text-sm font-medium max-w-[260px]">{r.prompt}</td>
                  <td className="px-4 py-3">
                    {r.mentioned
                      ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700"><Check className="w-3 h-3" /> Yes</span>
                      : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-50 text-red-600"><X className="w-3 h-3" /> No</span>}
                  </td>
                  <td className="px-4 py-3">{r.position ? <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">#{r.position}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[320px]">
                      {(r.competitors ?? []).slice(0, 6).map(c => (
                        <span key={c} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Who wins instead of you */}
      {rivalCounts.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Recommended most often across your prompts</p>
          <div className="space-y-2">
            {rivalCounts.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm w-44 truncate">{name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground nums w-14 text-right">{count}/{total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
