import { Bot, Search, Building2, Hash, TrendingUp, Loader2, Play } from 'lucide-react'
import { useBrands, useKeywords, useMentionRates, useLatestScanResults, useRunScan } from '../lib/hooks'

const MODEL_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude', grok: 'Grok',
}

export default function Dashboard() {
  const { data: brands = [] } = useBrands()
  const { data: keywords = [] } = useKeywords()
  const { data: mentionRates = [], isLoading: ratesLoading } = useMentionRates()
  const { data: recentScans = [], isLoading: scansLoading } = useLatestScanResults()
  const runScan = useRunScan()

  const ownBrand = brands.find(b => b.type === 'own')
  const ownRates = mentionRates.filter(r => r.brand_name === ownBrand?.name)
  const avgMentionRate = ownRates.length
    ? Math.round(ownRates.reduce((a, r) => a + Number(r.mention_rate_pct), 0) / ownRates.length)
    : null

  const stats = [
    { label: 'Avg AI Mention Rate', value: avgMentionRate != null ? `${avgMentionRate}%` : '—', icon: Bot, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Brands Tracked', value: String(brands.length), icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Keywords Active', value: String(keywords.length), icon: Hash, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Scans', value: String(recentScans.length), icon: Search, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]

  // Share of voice from mention rates
  const sovByBrand = brands.map(b => {
    const rates = mentionRates.filter(r => r.brand_name === b.name)
    const avg = rates.length ? rates.reduce((a, r) => a + Number(r.mention_rate_pct), 0) / rates.length : 0
    return { name: b.name, pct: Math.round(avg) }
  }).filter(b => b.pct > 0)

  const isEmpty = brands.length === 0 && keywords.length === 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              {recentScans.length > 0
                ? `Last scan: ${new Date(recentScans[0]?.scanned_at).toLocaleString()}`
                : 'No scans yet'}
            </p>
          </div>
        </div>
        <button
          onClick={() => runScan.mutate()}
          disabled={runScan.isPending || brands.length === 0 || keywords.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {runScan.isPending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
            : <><Play className="w-3.5 h-3.5" /> Run Scan</>}
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-semibold mb-1">Get started</p>
          <p className="text-xs text-muted-foreground mb-4">Add your brand and some keywords, then run your first scan.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/app/brands" className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg font-medium hover:bg-primary/90">Add Brand</a>
            <a href="/app/keywords" className="px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground">Add Keywords</a>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* AI Share of Voice */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">AI Share of Voice</p>
          {ratesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : sovByBrand.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet — run a scan</p>
          ) : (
            <div className="space-y-2">
              {sovByBrand.map(({ name, pct }, i) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-violet-500' : 'bg-slate-300'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mention rate by model */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">By AI Model</p>
          {ratesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : ownRates.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data yet</p>
          ) : (
            <div className="space-y-2">
              {ownRates.map(r => (
                <div key={r.model} className="flex items-center justify-between">
                  <span className="text-xs text-foreground">{MODEL_LABELS[r.model] ?? r.model}</span>
                  <span className="text-xs font-semibold text-foreground">{r.mention_rate_pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan status */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Last Scan Results</p>
          {runScan.isSuccess && (
            <div className="text-xs space-y-1">
              <p className="text-emerald-600 font-medium">Scan complete</p>
              <p className="text-muted-foreground">{(runScan.data as any)?.scanned} results stored</p>
              <p className="text-muted-foreground">Models: {(runScan.data as any)?.models_used?.join(', ')}</p>
            </div>
          )}
          {runScan.isError && (
            <p className="text-xs text-red-500">Scan failed — check API keys in Settings</p>
          )}
          {!runScan.isSuccess && !runScan.isError && (
            <p className="text-xs text-muted-foreground">Run a scan to see results</p>
          )}
        </div>
      </div>

      {/* Recent results table */}
      {recentScans.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent Scan Results</p>
          </div>
          {scansLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Brand', 'Keyword', 'Model', 'Mentioned', 'Sentiment', 'Position'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentScans.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium">{r.brand_name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[180px] truncate">{r.phrase}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{MODEL_LABELS[r.model] ?? r.model}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium ${r.mentioned ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {r.mentioned ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.sentiment ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                          r.sentiment === 'neutral' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>{r.sentiment}</span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
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
