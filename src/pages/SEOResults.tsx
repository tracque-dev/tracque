import { useState } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, Loader2, Link2, RefreshCw, Gauge, Users2, KeyRound, BarChart3, Target, Lightbulb, Plus, Check, BadgeCheck, AlertCircle } from 'lucide-react'
import { useLatestSeoResults, useDomainOverview, useBacklinks, useRunSeoSync, useKeywordGaps, useRunCompetitorIntel, useKeywordIdeas, useRunKeywordExplorer, useAddKeyword, useRankHistory, useRunKnowledgeCheck } from '../lib/hooks'

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? 'bg-emerald-50 text-emerald-700' : pos <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground'
  return <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${color}`}>#{pos}</span>
}

// Keyword difficulty bar (0–100), color-graded like Ahrefs KD.
function KDBadge({ kd }: { kd: number | null }) {
  if (kd == null) return <span className="text-xs text-muted-foreground">—</span>
  const color = kd < 30 ? '#10b981' : kd < 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${kd}%`, background: color }} />
      </div>
      <span className="font-mono text-xs nums" style={{ color }}>{kd}</span>
    </div>
  )
}

// Domain Rating (0–100) — higher is better, so green at the top end.
function DRBadge({ dr }: { dr: number | null }) {
  if (dr == null) return <span className="text-xs text-muted-foreground">—</span>
  const color = dr >= 60 ? '#10b981' : dr >= 30 ? '#f59e0b' : '#94a3b8'
  return <span className="font-mono text-sm font-semibold nums" style={{ color }}>{dr}</span>
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-4 h-4 text-foreground" />
      </div>
      <p className="text-2xl font-display font-bold nums tracking-tight">{value}</p>
      <p className="eyebrow text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// Rank position over time — inline SVG sparkline (lower position = better, drawn higher).
function RankSparkline({ points }: { points: { position: number | null; scanned_at: string }[] }) {
  const pts = points.filter(p => p.position != null) as { position: number; scanned_at: string }[]
  if (pts.length < 2) return <p className="text-xs text-muted-foreground">Not enough history yet — needs ≥2 scans to chart a trend.</p>
  const W = 320, H = 56, pad = 6
  const positions = pts.map(p => p.position)
  const min = Math.min(...positions), max = Math.max(...positions)
  const range = Math.max(1, max - min)
  const xy = pts.map((p, i) => [
    pad + (i / (pts.length - 1)) * (W - 2 * pad),
    pad + ((p.position - min) / range) * (H - 2 * pad), // worse (higher #) → lower on chart
  ])
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const delta = pts[pts.length - 1].position - pts[0].position // negative = improved
  const color = delta <= 0 ? '#10b981' : '#ef4444'
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[320px]" preserveAspectRatio="none">
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={color} />)}
      </svg>
      <p className="text-xs text-muted-foreground mt-1 nums">
        {pts.length} scans · {delta < 0 ? `▲ improved ${-delta}` : delta > 0 ? `▼ dropped ${delta}` : 'flat'} (#{pts[0].position} → #{pts[pts.length - 1].position})
      </p>
    </div>
  )
}

function KeywordRow({ row }: { row: any }) {
  const [open, setOpen] = useState(false)
  const { data: hist = [], isLoading } = useRankHistory(row.keyword_id, row.brand_id, open)
  return (
    <>
      <tr onClick={() => setOpen(o => !o)} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer">
        <td className="px-5 py-3 text-sm max-w-[200px] truncate font-medium">{row.phrase}</td>
        <td className="px-5 py-3 text-xs text-muted-foreground">{row.brand_name}</td>
        <td className="px-5 py-3">{row.position ? <PositionBadge pos={row.position} /> : <span className="text-xs text-muted-foreground">Not in top 100</span>}</td>
        <td className="px-5 py-3"><KDBadge kd={row.difficulty ?? null} /></td>
        <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(row.search_volume)}</td>
        <td className="px-5 py-3 text-xs nums text-muted-foreground">{row.cpc != null ? `$${Number(row.cpc).toFixed(2)}` : '—'}</td>
        <td className="px-5 py-3 text-xs text-muted-foreground truncate max-w-[180px]">{row.url ?? '—'}</td>
      </tr>
      {open && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={7} className="px-5 py-3">
            <p className="eyebrow text-muted-foreground mb-2">Rank history</p>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <RankSparkline points={hist} />}
          </td>
        </tr>
      )}
    </>
  )
}

function KeywordExplorer() {
  const { data: ideas = [] } = useKeywordIdeas()
  const explore = useRunKeywordExplorer()
  const addKw = useAddKeyword()
  const [seed, setSeed] = useState('')
  const [tracked, setTracked] = useState<Set<string>>(new Set())
  function track(kw: string) { addKw.mutate({ phrase: kw }); setTracked(s => new Set(s).add(kw)) }
  return (
    <div>
      <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> Keyword explorer</p>
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <form onSubmit={e => { e.preventDefault(); if (seed.trim()) explore.mutate(seed.trim()) }} className="flex items-center gap-2 p-3 border-b border-border bg-muted/40">
          <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="Seed keyword, e.g. crm" className="flex-1 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
          <button type="submit" disabled={explore.isPending || !seed.trim()} className="flex items-center gap-1.5 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40">
            {explore.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />} Explore
          </button>
        </form>
        {ideas.length === 0 ? (
          <p className="px-5 py-6 text-center text-xs text-muted-foreground">Enter a seed keyword to get idea suggestions with volume + difficulty.</p>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-border">
              {['Keyword', 'Volume', 'KD', 'CPC', 'Intent', ''].map(h => <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>)}
            </tr></thead>
            <tbody>
              {ideas.map(k => (
                <tr key={k.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium max-w-[220px] truncate">{k.keyword}</td>
                  <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(k.search_volume)}</td>
                  <td className="px-5 py-3"><KDBadge kd={k.difficulty} /></td>
                  <td className="px-5 py-3 text-xs nums text-muted-foreground">{k.cpc != null ? `$${Number(k.cpc).toFixed(2)}` : '—'}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{k.intent ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    {tracked.has(k.keyword ?? '')
                      ? <span className="text-xs text-emerald-600 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> tracked</span>
                      : <button onClick={() => k.keyword && track(k.keyword)} className="text-xs text-primary hover:underline inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> track</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function SEOResults() {
  const { data: results = [], isLoading } = useLatestSeoResults()
  const { data: domains = [] } = useDomainOverview()
  const runSync = useRunSeoSync()

  const own = domains.find(d => d.type === 'own') ?? domains[0]
  const { data: backlinks = [] } = useBacklinks(own?.brand_id)
  const { data: gaps = [] } = useKeywordGaps(own?.brand_id)
  const runIntel = useRunCompetitorIntel()
  const runKnowledge = useRunKnowledgeCheck()

  const ranked = results.filter(r => r.position != null)
  const avgPos = ranked.length ? Math.round(ranked.reduce((a, r) => a + (r.position ?? 0), 0) / ranked.length * 10) / 10 : null
  const top3 = ranked.filter(r => (r.position ?? 0) <= 3).length

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Search</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">SEO</h1>
          <p className="text-sm text-muted-foreground mt-1">Rank tracking, keyword metrics, backlinks & domain authority</p>
        </div>
        <button
          onClick={() => runSync.mutate({})}
          disabled={runSync.isPending}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40"
        >
          {runSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {runSync.isPending ? 'Scanning…' : 'Run SEO scan'}
        </button>
      </div>

      {/* Domain authority overview */}
      {own && (
        <div>
          <p className="eyebrow text-muted-foreground mb-3">
            Domain overview · <span className="text-foreground">{own.domain ?? own.brand_name}</span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Gauge}     label="Domain Rating"   value={own.domain_rating != null ? String(own.domain_rating) : '—'} />
            <StatCard icon={BarChart3} label="Organic traffic" value={fmt(own.organic_traffic)} sub="est. monthly" />
            <StatCard icon={KeyRound}  label="Organic keywords" value={fmt(own.organic_keywords)} />
            <StatCard icon={Users2}    label="Ref. domains"    value={fmt(own.referring_domains)} />
            <StatCard icon={Link2}     label="Backlinks"       value={fmt(own.backlinks_total)} />
          </div>
          {/* Knowledge panel — a strong AI-citation signal */}
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {own.has_knowledge_panel === true
              ? <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700"><BadgeCheck className="w-4 h-4" /> Google Knowledge Panel detected{own.knowledge_type ? ` · ${own.knowledge_type}` : ''}</span>
              : own.has_knowledge_panel === false
                ? <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-700"><AlertCircle className="w-4 h-4" /> No Knowledge Panel — a strong AI-citation gap to close</span>
                : <span className="text-xs text-muted-foreground">Knowledge Panel: not checked yet</span>}
            <button onClick={() => own.brand_id && runKnowledge.mutate(own.brand_id)} disabled={runKnowledge.isPending}
              className="text-xs text-primary hover:underline disabled:opacity-50 inline-flex items-center gap-1">
              {runKnowledge.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}{runKnowledge.isPending ? 'Checking…' : 'Check now'}
            </button>
          </div>
        </div>
      )}

      {/* Competitor comparison — own brand vs tracked competitors */}
      {domains.length > 1 && (
        <div>
          <p className="eyebrow text-muted-foreground mb-3">Competitors · domain authority</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Domain', 'DR', 'Organic traffic', 'Keywords', 'Ref. domains', 'Backlinks'].map(h => (
                    <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {domains.map(d => (
                  <tr key={d.brand_id} className={`border-b border-border last:border-0 transition-colors ${d.type === 'own' ? 'bg-blue-50/50' : 'hover:bg-muted/40'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.domain ?? d.brand_name}</span>
                        {d.type === 'own' && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">YOU</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3"><DRBadge dr={d.domain_rating} /></td>
                    <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(d.organic_traffic)}</td>
                    <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(d.organic_keywords)}</td>
                    <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(d.referring_domains)}</td>
                    <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(d.backlinks_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyword gaps — what competitors rank for that you don't */}
      {own?.brand_id && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow text-muted-foreground">Keyword gaps · competitors rank, you don't</p>
            <button onClick={() => runIntel.mutate(own.brand_id)} disabled={runIntel.isPending}
              className="flex items-center gap-1.5 text-xs border border-border rounded-xl px-3 py-2 hover:bg-muted disabled:opacity-40">
              {runIntel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              {runIntel.isPending ? 'Finding…' : 'Find keyword gaps'}
            </button>
          </div>
          {gaps.length > 0 && (
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  {['Keyword', 'Competitor', 'Their pos', 'Volume', 'KD', 'Intent'].map(h => <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>)}
                </tr></thead>
                <tbody>
                  {gaps.map(g => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium max-w-[220px] truncate">{g.keyword}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground truncate max-w-[150px]">{g.competitor_domain}</td>
                      <td className="px-5 py-3"><span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700">#{g.competitor_position ?? '—'}</span></td>
                      <td className="px-5 py-3 text-xs nums text-muted-foreground">{fmt(g.search_volume)}</td>
                      <td className="px-5 py-3"><KDBadge kd={g.difficulty} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{g.intent ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Keyword explorer */}
      <KeywordExplorer />

      {/* Rank summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Avg position"  value={avgPos != null ? String(avgPos) : '—'} />
        <StatCard icon={TrendingUp} label="In top 3"      value={String(top3)} />
        <StatCard icon={Search}     label="Tracked"       value={String(results.length)} sub="keyword × brand" />
      </div>

      {/* Tracked keywords */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No SEO data yet</p>
          <p className="text-xs mt-1">Click <span className="font-medium text-foreground">Run SEO scan</span> — needs a SerpAPI key (rank) and DataForSEO keys (metrics) in your Supabase secrets.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Keyword', 'Brand', 'Position', 'KD', 'Volume', 'CPC', 'Ranking URL'].map(h => (
                  <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row) => <KeywordRow key={row.id} row={row} />)}
            </tbody>
          </table>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <p className="eyebrow text-muted-foreground mb-3">Top backlinks · {own?.domain ?? own?.brand_name}</p>
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Source', 'DR', 'Anchor', 'Type', 'First seen'].map(h => (
                    <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backlinks.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 text-xs max-w-[220px] truncate">{b.source_domain ?? b.source_url}</td>
                    <td className="px-5 py-3 text-xs nums font-medium">{b.domain_rating ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{b.anchor || '—'}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${b.dofollow ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{b.dofollow ? 'dofollow' : 'nofollow'}</span></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{b.first_seen ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
