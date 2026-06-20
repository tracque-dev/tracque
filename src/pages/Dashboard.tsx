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

  // New account with nothing set up → onboarding (seeds brand/keywords/first scan).
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

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-primary">Overview</p>
          <h1 className="text-2xl font-display font-semibold tracking-tight mt-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {recentScans.length > 0
              ? `Last scan ${new Date(recentScans[0]?.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
              : 'No scans yet'}
          </p>
        </div>
        <button
          onClick={() => runScan.mutate()}
          disabled={runScan.isPending || brands.length === 0 || keywords.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {runScan.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</> : <><Play className="w-4 h-4" /> Run scan</>}
        </button>
      </div>

      {/* Hero metric + 2×2 stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-xl bg-card border border-border p-6">
          <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <p className="eyebrow text-muted-foreground">Avg AI mention rate</p>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-6xl font-display font-semibold tracking-tighter nums">{avgMentionRate != null ? avgMentionRate : '—'}</span>
              {avgMentionRate != null && <span className="text-2xl font-display text-muted-foreground">%</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {ownBrand ? `${ownBrand.name} across ${ownRates.length} AI model${ownRates.length === 1 ? '' : 's'}` : 'Add your brand to begin'}
            </p>
            {ownRates.length > 0 && (
              <div className="mt-6 space-y-2.5">
                {ownRates.map(r => (
                  <div key={r.model} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{MODEL_LABELS[r.model] ?? r.model}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${r.mention_rate_pct}%` }} />
                    </div>
                    <span className="text-xs nums text-foreground w-9 text-right">{r.mention_rate_pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-5 flex flex-col justify-between gap-4">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-4xl font-display font-semibold nums tracking-tight">{value}</p>
              <p className="eyebrow text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
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
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-white/25'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
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

        <div className="bg-card rounded-xl border border-border p-5">
          <p className="eyebrow text-muted-foreground mb-4">Last scan</p>
          {runScan.isSuccess && (
            <div className="text-sm space-y-1">
              <p className="text-[hsl(var(--success))] font-medium">Scan complete</p>
              <p className="text-muted-foreground">{(runScan.data as any)?.scanned} results stored</p>
              <p className="text-muted-foreground text-xs">Models: {(runScan.data as any)?.models_used?.join(', ')}</p>
            </div>
          )}
          {runScan.isError && <p className="text-sm text-destructive">Scan failed — check API keys in Settings</p>}
          {!runScan.isSuccess && !runScan.isError && (
            <p className="text-sm text-muted-foreground">Run a scan to refresh your AI visibility.</p>
          )}
        </div>
      </div>

      {/* Recent results table */}
      {recentScans.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <p className="eyebrow text-muted-foreground">Recent scan results</p>
            <a href="/app/ai" className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
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
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-sm font-medium">{r.brand_name}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{r.phrase}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">{MODEL_LABELS[r.model] ?? r.model}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-medium ${r.mentioned ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                        {r.mentioned ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.sentiment ? (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          r.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                          r.sentiment === 'neutral' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{r.sentiment}</span>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">{r.position ? `#${r.position}` : '—'}</td>
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
