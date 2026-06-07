import { Search, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { useLatestSeoResults } from '../lib/hooks'

function PositionChange({ curr, prev }: { curr: number; prev: number }) {
  const diff = prev - curr
  if (diff === 0) return <span className="flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="w-3 h-3" /></span>
  if (diff > 0) return <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium"><TrendingUp className="w-3 h-3" />+{diff}</span>
  return <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium"><TrendingDown className="w-3 h-3" />{diff}</span>
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? 'bg-emerald-50 text-emerald-700 font-bold' :
    pos <= 10 ? 'bg-amber-50 text-amber-700 font-medium' :
    'bg-muted text-muted-foreground'
  return <span className={`text-xs px-2 py-0.5 rounded ${color}`}>#{pos}</span>
}

export default function SEOResults() {
  const { data: results = [], isLoading } = useLatestSeoResults()

  const ranked = results.filter(r => r.position != null)
  const avgPos = ranked.length
    ? Math.round(ranked.reduce((a, r) => a + (r.position ?? 0), 0) / ranked.length * 10) / 10
    : null
  const top3 = ranked.filter(r => (r.position ?? 0) <= 3).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Search className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">SEO Rankings</h1>
          <p className="text-xs text-muted-foreground">Google rank tracking via SerpAPI</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-2xl font-bold">{avgPos ?? '—'}</p>
          <p className="text-xs text-muted-foreground">Avg Google position</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-2xl font-bold">{top3}</p>
          <p className="text-xs text-muted-foreground">Keywords in top 3</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-2xl font-bold">{results.length}</p>
          <p className="text-xs text-muted-foreground">Keyword/brand combos tracked</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No SEO data yet</p>
          <p className="text-xs mt-1">Add your SerpAPI key in Settings to enable Google rank tracking</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Keyword', 'Brand', 'Position', 'URL', 'Volume', 'Last checked'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-sm max-w-[180px] truncate">{row.phrase}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-foreground">{row.brand_name}</td>
                  <td className="px-4 py-2.5">
                    {row.position ? <PositionBadge pos={row.position} /> : <span className="text-xs text-muted-foreground">Not ranked</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">{row.url ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.search_volume ? row.search_volume.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(row.scanned_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
