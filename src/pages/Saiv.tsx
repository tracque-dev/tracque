import { useState, useMemo } from 'react'
import { LayoutGrid, Loader2, Play, Check, X, Trophy, MapPin } from 'lucide-react'
import { useBrands, useKeywords, useSaivResults, useRunSaivScan, useSaivGrid, useRunSaivGrid, type Brand } from '../lib/hooks'

// Local geo-grid: 3x3 heatmap of AI inclusion across nearby localities.
function GeoGrid({ ownBrand }: { ownBrand?: Brand }) {
  const { data: cells = [] } = useSaivGrid()
  const run = useRunSaivGrid()
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const hits = cells.filter(c => c.mentioned).length
  const coverage = cells.length ? Math.round((hits / cells.length) * 100) : 0
  // arrange into 3 rows of 3 (already ordered lat desc, lng asc)
  const rows3 = [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 9)].filter(r => r.length)

  return (
    <div>
      <p className="eyebrow text-muted-foreground mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Local geo-grid — "near me" coverage</p>
      <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div>
            <label className="eyebrow text-muted-foreground">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="credit union, plumber…" className="mt-0.5 w-44 px-3 py-1.5 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
          </div>
          <div>
            <label className="eyebrow text-muted-foreground">City</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Austin, TX" className="mt-0.5 w-40 px-3 py-1.5 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
          </div>
          <button onClick={() => ownBrand && category && location && run.mutate({ brand_id: ownBrand.id, category, location })}
            disabled={run.isPending || !ownBrand || !category || !location}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all">
            {run.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />} {run.isPending ? 'Mapping…' : 'Map the grid'}
          </button>
          {run.isPending && <span className="text-xs text-muted-foreground">9 cells × a web-grounded query — ~1 min…</span>}
        </div>
        {cells.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">Enter a category + city to map where AI does (and doesn't) recommend you across the area.</p>
        ) : (
          <div className="flex items-start gap-6">
            <div className="grid grid-cols-3 gap-1.5">
              {rows3.flat().map(c => (
                <div key={c.id} title={`${c.label ?? ''}${c.position ? ` · #${c.position}` : ''}`}
                  className={`w-24 h-16 rounded-xl flex flex-col items-center justify-center text-center px-1 ${c.mentioned ? (c.position && c.position <= 3 ? 'bg-emerald-500 text-white' : 'bg-emerald-200 text-emerald-900') : 'bg-red-100 text-red-700'}`}>
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">{c.label}</span>
                  {c.mentioned ? <span className="text-[10px] font-mono mt-0.5">{c.position ? `#${c.position}` : '✓'}</span> : <span className="text-[10px] font-mono mt-0.5">—</span>}
                </div>
              ))}
            </div>
            <div>
              <p className="text-3xl font-display font-bold nums tracking-tight">{coverage}%</p>
              <p className="text-xs text-muted-foreground">recommended in {hits}/{cells.length} areas</p>
              <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px]">Green = recommended, red = invisible. Local AI answers vary by area — red cells are where to focus.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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

  // TRUE share of AI voice: your appearances vs every brand AI names across
  // the prompts, normalized to a competitive share (not just your inclusion rate).
  const sov = useMemo(() => {
    const m = new Map<string, number>()
    if (ownBrand) m.set(ownBrand.name, rows.filter(r => r.mentioned).length)
    rows.forEach(r => (r.competitors ?? []).forEach(c => {
      if (ownBrand && c.toLowerCase() === ownBrand.name.toLowerCase()) return
      m.set(c, (m.get(c) ?? 0) + 1)
    }))
    const totalMentions = [...m.values()].reduce((a, b) => a + b, 0)
    const board = [...m.entries()]
      .map(([name, count]) => ({ name, count, share: totalMentions ? Math.round((count / totalMentions) * 100) : 0, you: name === ownBrand?.name }))
      .sort((a, b) => b.count - a.count)
    return { totalMentions, board, yourShare: board.find(b => b.you)?.share ?? 0 }
  }, [rows, ownBrand])

  function run() {
    if (!ownBrand) return
    const list = promptText.split('\n').map(s => s.trim()).filter(Boolean)
    if (list.length) runScan.mutate({ brand_id: ownBrand.id, prompts: list })
  }

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Visibility</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Share of AI Voice</h1>
          <p className="text-sm text-muted-foreground mt-1">Across real buyer prompts — are you recommended, and who shows up instead?</p>
        </div>
      </div>

      {/* Prompt input */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-3">
        <label className="eyebrow text-muted-foreground">Prompts to test (one per line, up to 12)</label>
        <textarea value={promptText} onChange={e => setPrompts(e.target.value)} rows={4}
          placeholder={"best project management software\nnotion alternatives\ntools for product teams"}
          className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background font-mono focus:ring-blue-500" />
        <div className="flex items-center gap-3">
          <button onClick={run} disabled={runScan.isPending || !ownBrand}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all">
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
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <p className="eyebrow text-muted-foreground mb-2">Share of AI Voice</p>
            <p className="text-3xl font-display font-bold nums tracking-tight">{sov.yourShare}%</p>
            <p className="text-xs text-muted-foreground mt-1">your share of every brand AI names</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <p className="eyebrow text-muted-foreground mb-2">AI inclusion rate</p>
            <p className="text-3xl font-display font-bold nums tracking-tight">{saiv}%</p>
            <p className="text-xs text-muted-foreground mt-1">recommended in {mentioned}/{total} prompts</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <p className="eyebrow text-muted-foreground mb-2">Avg position</p>
            <p className="text-3xl font-display font-bold nums tracking-tight">{avgPos ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">when recommended</p>
          </div>
        </div>
      )}

      {/* Local geo-grid heatmap */}
      <GeoGrid ownBrand={ownBrand} />

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : total === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-2xl">
          <LayoutGrid className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No AI-voice data yet</p>
          <p className="text-xs mt-1">Add prompts your buyers actually ask AI, then run a scan.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Prompt', 'Recommended?', 'Position', 'Who shows up'].map(h => (
                  <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors align-top">
                  <td className="px-5 py-3 text-sm font-medium max-w-[260px]">{r.prompt}</td>
                  <td className="px-5 py-3">
                    {r.mentioned
                      ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700"><Check className="w-3 h-3" /> Yes</span>
                      : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-600"><X className="w-3 h-3" /> No</span>}
                  </td>
                  <td className="px-5 py-3">{r.position ? <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">#{r.position}</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[320px]">
                      {(r.competitors ?? []).slice(0, 6).map(c => (
                        <span key={c} className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-foreground">{c}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Share-of-voice leaderboard — you vs everyone AI names */}
      {sov.board.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> Share of AI voice — you vs the field</p>
          <div className="space-y-2.5">
            {sov.board.slice(0, 8).map(b => (
              <div key={b.name} className="flex items-center gap-3">
                <span className={`text-sm w-44 truncate ${b.you ? 'font-semibold text-foreground' : ''}`}>
                  {b.name}{b.you && <span className="ml-1.5 text-[10px] font-mono uppercase text-blue-600">you</span>}
                </span>
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.you ? 'bg-blue-600' : 'bg-slate-300'}`} style={{ width: `${b.share}%` }} />
                </div>
                <span className="text-xs nums w-12 text-right font-medium">{b.share}%</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">Of every brand AI named across your {total} prompt{total === 1 ? '' : 's'}, this is who got the airtime.</p>
        </div>
      )}
    </div>
  )
}
