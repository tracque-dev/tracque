import { Bot, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { useLatestScanResults, useRunScan, useBrands, useKeywords } from '../lib/hooks'

const MODEL_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude', grok: 'Grok',
}
const MODEL_COLORS: Record<string, string> = {
  chatgpt: 'bg-emerald-50 text-emerald-700',
  perplexity: 'bg-blue-50 text-blue-700',
  gemini: 'bg-violet-50 text-violet-700',
  claude: 'bg-amber-50 text-amber-700',
  grok: 'bg-slate-100 text-slate-700',
}

export default function AIResults() {
  const { data: scans = [], isLoading } = useLatestScanResults()
  const { data: brands = [] } = useBrands()
  const { data: keywords = [] } = useKeywords()
  const runScan = useRunScan()

  // Group by keyword phrase
  const byKeyword = keywords.map(kw => ({
    keyword: kw,
    entries: scans.filter(s => s.keyword_id === kw.id),
  })).filter(g => g.entries.length > 0)

  // Model mention rates across all scans
  const models = [...new Set(scans.map(s => s.model))]
  const modelRates = models.map(model => {
    const forModel = scans.filter(s => s.model === model)
    const mentioned = forModel.filter(s => s.mentioned).length
    return { model, rate: forModel.length > 0 ? Math.round((mentioned / forModel.length) * 100) : 0 }
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">AI Visibility</h1>
            <p className="text-xs text-muted-foreground">How AI models mention your brands</p>
          </div>
        </div>
        <button
          onClick={() => runScan.mutate()}
          disabled={runScan.isPending || brands.length === 0 || keywords.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-50 transition-colors"
        >
          {runScan.isPending
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning…</>
            : <><RefreshCw className="w-3.5 h-3.5" /> Re-scan</>}
        </button>
      </div>

      {/* Model mention rate cards */}
      {modelRates.length > 0 && (
        <div className="grid grid-cols-5 gap-3">
          {modelRates.map(({ model, rate }) => {
            const forModel = scans.filter(s => s.model === model && s.mentioned)
            const avgConf = forModel.length
              ? Math.round(forModel.reduce((a, s) => a + (s.confidence_pct ?? 0), 0) / forModel.length)
              : null
            const webGrounded = scans.filter(s => s.model === model).some(s => s.web_grounded)
            return (
              <div key={model} className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_COLORS[model] ?? 'bg-muted text-muted-foreground'}`}>
                    {MODEL_LABELS[model] ?? model}
                  </span>
                  {webGrounded && <span title="Web grounded — live data" className="text-emerald-500 text-xs">⚡</span>}
                </div>
                <p className="text-2xl font-bold mt-1">{rate}%</p>
                <p className="text-xs text-muted-foreground">mention rate</p>
                {avgConf != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">{avgConf}% confidence</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : byKeyword.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No scan results yet</p>
          <p className="text-xs mt-1">Add brands + keywords, then run a scan from the Dashboard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byKeyword.map(({ keyword, entries }) => (
            <div key={keyword.id} className="bg-card rounded-xl border border-border shadow-card">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">"{keyword.phrase}"</p>
              </div>
              <div className="divide-y divide-border">
                {entries.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-4">
                    <div className="w-24 shrink-0 pt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_COLORS[entry.model] ?? 'bg-muted text-muted-foreground'}`}>
                        {MODEL_LABELS[entry.model] ?? entry.model}
                      </span>
                    </div>
                    <div className="w-24 shrink-0 text-xs text-muted-foreground font-medium pt-0.5">
                      {entry.brand_name}
                    </div>
                    <div className="shrink-0">
                      {entry.mentioned
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                        : <XCircle className="w-4 h-4 text-muted-foreground mt-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.mentioned ? (
                        <>
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            {entry.position && <span className="text-xs text-muted-foreground">#{entry.position}</span>}
                            {entry.confidence_pct != null && (
                              <span className="text-xs text-muted-foreground">{entry.confidence_pct}% confidence</span>
                            )}
                            {entry.runs_total > 1 && (
                              <span className="text-xs text-muted-foreground">{entry.runs_mentioned}/{entry.runs_total} runs</span>
                            )}
                            {entry.sentiment && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                entry.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700' :
                                entry.sentiment === 'neutral' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>{entry.sentiment}</span>
                            )}
                            {entry.web_grounded && (
                              <span className="text-xs text-emerald-600 font-medium">⚡ live web</span>
                            )}
                            {(entry.citation_urls ?? entry.sources)?.slice(0, 3).map((s: string) => (
                              <span key={s} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{s}</span>
                            ))}
                          </div>
                          {entry.excerpt && (
                            <p className="text-xs text-muted-foreground italic line-clamp-1">"{entry.excerpt}"</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not mentioned</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
