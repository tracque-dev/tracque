import { Search, TrendingUp, TrendingDown, Minus, Loader2, Link2, RefreshCw, Gauge, Users2, KeyRound, BarChart3, Target } from 'lucide-react'
import { useLatestSeoResults, useDomainOverview, useBacklinks, useRunSeoSync, useKeywordGaps, useRunCompetitorIntel } from '../lib/hooks'

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? 'bg-emerald-50 text-emerald-700' : pos <= 10 ? 'bg-amber-50 text-amber-700' : 'bg-muted text-muted-foreground'
  return <span className={`font-mono text-xs px-2 py-0.5 rounded ${color}`}>#{pos}</span>
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
    <div className="bg-card rounded-xl border border-border p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <p className="text-[11px] font-mono uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-2xl font-bold nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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

  const ranked = results.filter(r => r.position != null)
  const avgPos = ranked.length ? Math.round(ranked.reduce((a, r) => a + (r.position ?? 0), 0) / ranked.length * 10) / 10 : null
  const top3 = ranked.filter(r => (r.position ?? 0) <= 3).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Search className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">SEO</h1>
            <p className="text-xs text-muted-foreground">Rank tracking, keyword metrics, backlinks & domain authority</p>
          </div>
        </div>
        <button
          onClick={() => runSync.mutate({})}
          disabled={runSync.isPending}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {runSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {runSync.isPending ? 'Scanning…' : 'Run SEO scan'}
        </button>
      </div>

      {/* Domain authority overview */}
      {own && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Domain overview · <span className="text-foreground">{own.domain ?? own.brand_name}</span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Gauge}     label="Domain Rating"   value={own.domain_rating != null ? String(own.domain_rating) : '—'} />
            <StatCard icon={BarChart3} label="Organic traffic" value={fmt(own.organic_traffic)} sub="est. monthly" />
            <StatCard icon={KeyRound}  label="Organic keywords" value={fmt(own.organic_keywords)} />
            <StatCard icon={Users2}    label="Ref. domains"    value={fmt(own.referring_domains)} />
            <StatCard icon={Link2}     label="Backlinks"       value={fmt(own.backlinks_total)} />
          </div>
        </div>
      )}

      {/* Competitor comparison — own brand vs tracked competitors */}
      {domains.length > 1 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Competitors · domain authority</p>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Domain', 'DR', 'Organic traffic', 'Keywords', 'Ref. domains', 'Backlinks'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {domains.map(d => (
                  <tr key={d.brand_id} className={`border-b border-border last:border-0 transition-colors ${d.type === 'own' ? 'bg-blue-50/50' : 'hover:bg-muted/20'}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.domain ?? d.brand_name}</span>
                        {d.type === 'own' && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">YOU</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><DRBadge dr={d.domain_rating} /></td>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(d.organic_traffic)}</td>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(d.organic_keywords)}</td>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(d.referring_domains)}</td>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(d.backlinks_total)}</td>
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Keyword gaps · competitors rank, you don't</p>
            <button onClick={() => runIntel.mutate(own.brand_id)} disabled={runIntel.isPending}
              className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-muted/40 disabled:opacity-50">
              {runIntel.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              {runIntel.isPending ? 'Finding…' : 'Find keyword gaps'}
            </button>
          </div>
          {gaps.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-muted/30">
                  {['Keyword', 'Competitor', 'Their pos', 'Volume', 'KD', 'Intent'].map(h => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>)}
                </tr></thead>
                <tbody>
                  {gaps.map(g => (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium max-w-[220px] truncate">{g.keyword}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[150px]">{g.competitor_domain}</td>
                      <td className="px-4 py-2.5"><span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">#{g.competitor_position ?? '—'}</span></td>
                      <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(g.search_volume)}</td>
                      <td className="px-4 py-2.5"><KDBadge kd={g.difficulty} /></td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground capitalize">{g.intent ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No SEO data yet</p>
          <p className="text-xs mt-1">Click <span className="font-medium text-foreground">Run SEO scan</span> — needs a SerpAPI key (rank) and DataForSEO keys (metrics) in your Supabase secrets.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Keyword', 'Brand', 'Position', 'KD', 'Volume', 'CPC', 'Ranking URL'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-sm max-w-[200px] truncate font-medium">{row.phrase}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.brand_name}</td>
                  <td className="px-4 py-2.5">{row.position ? <PositionBadge pos={row.position} /> : <span className="text-xs text-muted-foreground">Not in top 100</span>}</td>
                  <td className="px-4 py-2.5"><KDBadge kd={(row as any).difficulty ?? null} /></td>
                  <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{fmt(row.search_volume)}</td>
                  <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{(row as any).cpc != null ? `$${Number((row as any).cpc).toFixed(2)}` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[180px]">{row.url ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Top backlinks · {own?.domain ?? own?.brand_name}</p>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Source', 'DR', 'Anchor', 'Type', 'First seen'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backlinks.map((b) => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-xs max-w-[220px] truncate">{b.source_domain ?? b.source_url}</td>
                    <td className="px-4 py-2.5 text-xs nums font-medium">{b.domain_rating ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{b.anchor || '—'}</td>
                    <td className="px-4 py-2.5"><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${b.dofollow ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{b.dofollow ? 'dofollow' : 'nofollow'}</span></td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.first_seen ?? '—'}</td>
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
