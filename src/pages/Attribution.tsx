import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Users, Zap } from 'lucide-react'

const SOURCES = [
  { source: 'perplexity', label: 'Perplexity AI', sessions: 1240, conversions: 38, revenue: 9500, color: 'bg-blue-500' },
  { source: 'chatgpt', label: 'ChatGPT', sessions: 890, conversions: 21, revenue: 5250, color: 'bg-emerald-500' },
  { source: 'google', label: 'Google (organic)', sessions: 4200, conversions: 84, revenue: 21000, color: 'bg-amber-500' },
  { source: 'google_ads', label: 'Google Ads', sessions: 3100, conversions: 62, revenue: 15500, color: 'bg-red-400' },
  { source: 'meta_ads', label: 'Meta Ads', sessions: 2800, conversions: 42, revenue: 10500, color: 'bg-indigo-500' },
  { source: 'gemini', label: 'Gemini', sessions: 340, conversions: 8, revenue: 2000, color: 'bg-violet-500' },
]

const totalRevenue = SOURCES.reduce((a, s) => a + s.revenue, 0)
const totalConversions = SOURCES.reduce((a, s) => a + s.conversions, 0)
const totalSessions = SOURCES.reduce((a, s) => a + s.sessions, 0)
const aiRevenue = SOURCES.filter(s => ['perplexity', 'chatgpt', 'gemini', 'claude', 'grok'].includes(s.source)).reduce((a, s) => a + s.revenue, 0)

export default function Attribution() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Attribution</h1>
          <p className="text-xs text-muted-foreground">Revenue from AI search, SEO, and paid ads — in one place</p>
        </div>
      </div>

      {/* Setup banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-primary">Connect your data sources</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Run a Site Audit to install the Tracque tracking snippet, then connect Google Analytics, Meta Ads, and Google Ads to see revenue attribution across all channels.
          </p>
          <div className="flex gap-2 mt-2">
            <a href="/app/site-audit" className="text-xs px-2.5 py-1 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
              Run Site Audit
            </a>
            <a href="/app/settings" className="text-xs px-2.5 py-1 border border-border rounded-lg text-muted-foreground hover:text-foreground">
              Connect Ad Accounts
            </a>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Conversions', value: totalConversions.toString(), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Sessions', value: totalSessions.toLocaleString(), icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'AI-Driven Revenue', value: `$${aiRevenue.toLocaleString()}`, icon: MousePointerClick, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue by source */}
      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue by Source</p>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Source', 'Sessions', 'Conversions', 'Conv. Rate', 'Revenue', '% of Total'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SOURCES.sort((a, b) => b.revenue - a.revenue).map((s) => {
              const convRate = ((s.conversions / s.sessions) * 100).toFixed(1)
              const revPct = ((s.revenue / totalRevenue) * 100).toFixed(1)
              const isAI = ['perplexity', 'chatgpt', 'gemini', 'claude', 'grok'].includes(s.source)
              return (
                <tr key={s.source} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium">{s.label}</span>
                      {isAI && <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">AI</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.sessions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{s.conversions}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{convRate}%</td>
                  <td className="px-4 py-3 text-sm font-semibold">${s.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${s.color} rounded-full`} style={{ width: `${revPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{revPct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* AI vs Paid vs Organic breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'AI Search', sources: ['perplexity', 'chatgpt', 'gemini'], color: 'bg-blue-500' },
          { label: 'Paid Ads', sources: ['google_ads', 'meta_ads'], color: 'bg-red-400' },
          { label: 'Organic SEO', sources: ['google'], color: 'bg-amber-500' },
        ].map(({ label, sources, color }) => {
          const rev = SOURCES.filter(s => sources.includes(s.source)).reduce((a, s) => a + s.revenue, 0)
          const conv = SOURCES.filter(s => sources.includes(s.source)).reduce((a, s) => a + s.conversions, 0)
          const pct = ((rev / totalRevenue) * 100).toFixed(0)
          return (
            <div key={label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
              <p className="text-2xl font-bold">${rev.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{conv} conversions · {pct}% of revenue</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
