import { Navigate } from 'react-router-dom'
import { Bot, Search, Building2, Hash, Loader2, Play, ArrowUpRight } from 'lucide-react'
import { useBrands, useKeywords, useMentionRates, useLatestScanResults, useRunScan } from '../lib/hooks'

const MODEL_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude', grok: 'Grok',
}

export default function Dashboard() {
  const { data: brands = [], isLoading: brandsLoading } = useBrands()
  const { data: keywords = [] } = useKeywords()
  const { data: mentionRates = [], isLoading: ratesLoading } = useMentionRates()
  const { data: recentScans = [], isLoading: scansLoading } = useLatestScanResults()
  const runScan = useRunScan()

  // A brand-new account has nothing set up → run them through onboarding
  // (seeds their brand, keywords, and first scan) so the app is never empty.
  if (!brandsLoading && brands.length === 0) return <Navigate to="/app/onboarding" replace />

  const ownBrand = brands.find(b => b.type === 'own')
  const ownRates = mentionRates.filter(r => r.brand_name === ownBrand?.name)
  const avgMentionRate = ownRates.length
    ? Math.round(ownRates.reduce((a, r) => a + Number(r.mention_rate_pct), 0) / ownRates.length)
    : null

  const competitors = brands.filter(b => b.type === 'competitor').length
  const stats = [
    { label: 'Brands tracked', value: String(brands.length), icon: Building2 },
    { label: 'Keywords active', value: String(keywords.length), icon: Hash },
    { label: 'Total scans', value: String(recentScans.length), icon: Search },
    { label: 'Competitors', value: String(competitors), icon: Bot },
  ]

  const sovByBrand = brands.map(b => {
    const rates = mentionRates.filter(r => r.brand_name === b.name)
    const avg = rates.length ? rates.reduce((a, r) => a + Number(r.mention_rate_pct), 0) / rates.length : 0
    return { name: b.name, pct: Math.round(avg) }
  }).filter(b => b.pct > 0).sort((a, b) => b.pct - a.pct)

  const isEmpty = brands.length === 0 && keywords.length === 0

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-violet-600">Overview</p>
          <h1 className="text-3xl font-display font-bold tracking-tight mt-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {recentScans.length > 0
              ? `Last scan ${new Date(recentScans[0]?.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
              : 'No scans yet'}
          </p>
        </div>
        <button
          onClick={() => runScan.mutate()}
          disabled={runScan.isPending || brands.length === 0 || keywords.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-foreground text-background rounded-xl font-medium hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {runScan.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
            : <><Play className="w-4 h-4" /> Run scan</>}
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-card">
          <p className="text-base font-display font-semibold mb-1">Get started</p>
          <p className="text-sm text-muted-foreground mb-5">Add your brand and some keywords, then run your first scan.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/app/brands" className="px-4 py-2 text-sm bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700">Add brand</a>
            <a href="/app/keywords" className="px-4 py-2 text-sm border border-border rounded-xl text-foreground hover:bg-muted">Add keywords</a>
          </div>
        </div>
      )}

      {/* Hero metric + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Hero — AI mention rate */}
        <div className="lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-2xl bg-ink-grad text-white p-6 shadow-lg">
          <div className="absolute inset-0 rails opacity-60 pointer-events-none" />
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-violet-600/30 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-violet-400" />
              <p className="eyebrow text-white/50">Avg AI mention rate</p>
            </div>
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-6xl font-display font-bold tracking-tight nums">{avgMentionRate != null ? avgMentionRate : '—'}</span>
              {avgMentionRate != null && <span className="text-2xl font-display text-white/50">%</span>}
            </div>
            <p className="text-sm text-white/55 mt-2">
              {ownBrand ? `${ownBrand.name} across ${ownRates.length} AI model${ownRates.length === 1 ? '' : 's'}` : 'Add your brand to begin'}
            </p>
            {/* per-model mini bars */}
            {ownRates.length > 0 && (
              <div className="mt-5 space-y-2">
                {ownRates.map(r => (
                  <div key={r.model} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 w-20 shrink-0">{MODEL_LABELS[r.model] ?? r.model}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.mention_rate_pct}%` }} />
                    </div>
                    <span className="text-xs nums text-white/80 w-9 text-right">{r.mention_rate_pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stat cards (2×2 beside the tall hero) */}
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-2xl border border-border p-5 shadow-card flex flex-col justify-between gap-4">
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-4xl font-display font-bold nums tracking-tight">{value}</p>
              <p className="eyebrow text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Share of Voice */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="eyebrow text-muted-foreground mb-4">AI share of voice</p>
          {ratesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : sovByBrand.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet — run a scan</p>
          ) : (
            <div className="space-y-3">
              {sovByBrand.map(({ name, pct }, i) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium truncate">{name}</span>
                    <span className="nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? 'bg-violet-600' : i === 1 ? 'bg-violet-400' : 'bg-slate-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By model */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="eyebrow text-muted-foreground mb-4">By AI model</p>
          {ratesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : ownRates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-3">
              {ownRates.map(r => (
                <div key={r.model} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{MODEL_LABELS[r.model] ?? r.model}</span>
                  <span className="text-sm font-display font-semibold nums">{r.mention_rate_pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan status */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <p className="eyebrow text-muted-foreground mb-4">Last scan</p>
          {runScan.isSuccess && (
            <div className="text-sm space-y-1">
              <p className="text-[hsl(var(--success))] font-medium">Scan complete</p>
              <p className="text-muted-foreground">{(runScan.data as any)?.scanned} results stored</p>
              <p className="text-muted-foreground text-xs">Models: {(runScan.data as any)?.models_used?.join(', ')}</p>
            </div>
          )}
          {runScan.isError && (
            <p className="text-sm text-destructive">Scan failed — check API keys in Settings</p>
          )}
          {!runScan.isSuccess && !runScan.isError && (
            <p className="text-sm text-muted-foreground">Run a scan to refresh your AI visibility.</p>
          )}
        </div>
      </div>

      {/* Recent results table */}
      {recentScans.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="eyebrow text-muted-foreground">Recent scan results</p>
            <a href="/app/ai" className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700">
              View all <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {scansLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Brand', 'Keyword', 'Model', 'Mentioned', 'Sentiment', 'Position'].map(h => (
                    <th key={h} className="px-5 py-2.5 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentScans.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium">{r.brand_name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{r.phrase}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md font-medium">{MODEL_LABELS[r.model] ?? r.model}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${r.mentioned ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                        {r.mentioned ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.sentiment ? (
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          r.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                          r.sentiment === 'neutral' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{r.sentiment}</span>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">
                      {r.position ? `#${r.position}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
