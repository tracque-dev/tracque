import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, MousePointerClick, Users, Loader2, Plus, Check, Copy, Code2 } from 'lucide-react'
import { useAttributionBySource, useTrackingSites, useCreateTrackingSite, type SourceAttribution } from '../lib/hooks'

const AI_SOURCES = new Set(['chatgpt', 'perplexity', 'gemini', 'claude', 'grok', 'copilot'])

const LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', gemini: 'Gemini', claude: 'Claude', grok: 'Grok', copilot: 'Copilot',
  google: 'Google (organic)', bing: 'Bing', paid_google: 'Google Ads', paid_meta: 'Meta Ads',
  referral: 'Referral', direct: 'Direct',
}
const COLORS: Record<string, string> = {
  chatgpt: 'bg-emerald-500', perplexity: 'bg-blue-500', gemini: 'bg-blue-500', claude: 'bg-orange-500',
  grok: 'bg-slate-800', copilot: 'bg-cyan-500', google: 'bg-amber-500', bing: 'bg-teal-500',
  paid_google: 'bg-red-400', paid_meta: 'bg-indigo-500', referral: 'bg-pink-400', direct: 'bg-gray-400',
}
const label = (s: string) => LABELS[s] ?? s
const color = (s: string) => COLORS[s] ?? 'bg-gray-400'
const money = (n: number) => `$${Math.round(n).toLocaleString()}`

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className={`w-9 h-9 rounded-xl ${tint} flex items-center justify-center mb-3`}><Icon className="w-4 h-4" /></div>
      <p className="text-2xl font-display font-bold nums tracking-tight">{value}</p>
      <p className="eyebrow text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function InstallSnippet({ siteKey }: { siteKey: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = `<script async src="https://tracque.com/t.js" data-tracque="${siteKey}"></script>`
  function copy() { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  return (
    <div className="bg-ink-grad rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow text-white/50 flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> Install snippet</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white transition-colors">
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <code className="block font-mono text-[12px] text-emerald-300 break-all leading-relaxed">{snippet}</code>
      <p className="text-[11px] text-white/45 mt-3 leading-relaxed">
        Paste before <code className="text-white/70">&lt;/head&gt;</code> on the client's site. Then fire conversions with
        <code className="text-white/70"> tracque('conversion', {'{'} value: 99 {'}'})</code>. If GA4 is installed, events mirror automatically.
      </p>
    </div>
  )
}

export default function Attribution() {
  const { data: rows = [], isLoading } = useAttributionBySource()
  const { data: sites = [] } = useTrackingSites()
  const createSite = useCreateTrackingSite()
  const [domain, setDomain] = useState('')
  const [ga4, setGa4] = useState('')

  const site = sites[0]
  const totalRevenue = rows.reduce((a, s) => a + Number(s.revenue), 0)
  const totalConversions = rows.reduce((a, s) => a + Number(s.conversions), 0)
  const totalSessions = rows.reduce((a, s) => a + Number(s.sessions), 0)
  const aiRevenue = rows.filter(s => s.is_ai || AI_SOURCES.has(s.source)).reduce((a, s) => a + Number(s.revenue), 0)
  const sorted = [...rows].sort((a, b) => Number(b.revenue) - Number(a.revenue) || Number(b.sessions) - Number(a.sessions))

  return (
    <div className="p-7 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-blue-600">Revenue</p>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-1">Attribution</h1>
          <p className="text-sm text-muted-foreground mt-1">AI mention → click → conversion → revenue, in one place</p>
        </div>
      </div>

      {/* Setup / snippet */}
      {!site ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-sm font-display font-semibold text-blue-700 mb-1">Set up conversion tracking</p>
          <p className="text-xs text-muted-foreground mb-4">Generate a tracking snippet for this client. It captures which AI engine (or ad) sent each visitor, then ties it to conversions and revenue.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Site domain (optional)</label>
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="acme.com" className="mt-1 w-44 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GA4 ID (optional)</label>
              <input value={ga4} onChange={e => setGa4(e.target.value)} placeholder="G-XXXXXXX" className="mt-1 w-40 px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-blue-500" />
            </div>
            <button onClick={() => createSite.mutate({ domain: domain || undefined, ga4_id: ga4 || undefined })} disabled={createSite.isPending}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all">
              {createSite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Generate snippet
            </button>
          </div>
        </div>
      ) : (
        <InstallSnippet siteKey={site.site_key} />
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total revenue" value={money(totalRevenue)} tint="bg-muted text-foreground" />
        <StatCard icon={MousePointerClick} label="AI-driven revenue" value={money(aiRevenue)} tint="bg-blue-50 text-blue-600" />
        <StatCard icon={TrendingUp} label="Conversions" value={totalConversions.toLocaleString()} tint="bg-muted text-foreground" />
        <StatCard icon={Users} label="Sessions" value={totalSessions.toLocaleString()} tint="bg-muted text-foreground" />
      </div>

      {/* By source */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-2xl">
          <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-display font-semibold">No attribution data yet</p>
          <p className="text-xs mt-1">{site ? 'Install the snippet above — visits and conversions will appear here.' : 'Generate a tracking snippet to start collecting data.'}</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><p className="eyebrow text-muted-foreground">Revenue by source</p></div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Source', 'Sessions', 'Conversions', 'Conv. rate', 'Revenue', '% of total'].map(h => (
                  <th key={h} className="px-5 py-3 text-left eyebrow text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => {
                const isAi = s.is_ai || AI_SOURCES.has(s.source)
                const cr = s.sessions ? ((s.conversions / s.sessions) * 100).toFixed(1) : '0.0'
                const pct = totalRevenue ? ((s.revenue / totalRevenue) * 100).toFixed(0) : '0'
                return (
                  <tr key={s.source} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color(s.source)}`} />
                        <span className="text-sm font-medium">{label(s.source)}</span>
                        {isAi && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">AI</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">{Number(s.sessions).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">{Number(s.conversions).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm nums text-muted-foreground">{cr}%</td>
                    <td className="px-5 py-3 text-sm font-display font-semibold nums">{money(Number(s.revenue))}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden"><div className={`h-full ${color(s.source)} rounded-full`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs text-muted-foreground nums">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* AI vs Paid vs Organic */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'AI Search', match: (s: SourceAttribution) => s.is_ai || AI_SOURCES.has(s.source), color: 'bg-blue-600' },
            { label: 'Paid Ads', match: (s: SourceAttribution) => s.source.startsWith('paid_'), color: 'bg-blue-300' },
            { label: 'Organic / Direct', match: (s: SourceAttribution) => ['google', 'bing', 'referral', 'direct'].includes(s.source), color: 'bg-slate-300' },
          ].map(g => {
            const grp = rows.filter(g.match)
            const rev = grp.reduce((a, s) => a + Number(s.revenue), 0)
            const conv = grp.reduce((a, s) => a + Number(s.conversions), 0)
            const pct = totalRevenue ? ((rev / totalRevenue) * 100).toFixed(0) : '0'
            return (
              <div key={g.label} className="bg-card rounded-2xl border border-border p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3"><span className={`w-2.5 h-2.5 rounded-full ${g.color}`} /><p className="eyebrow text-muted-foreground">{g.label}</p></div>
                <p className="text-2xl font-display font-bold nums tracking-tight">{money(rev)}</p>
                <p className="text-xs text-muted-foreground mt-1">{conv} conversions · {pct}% of revenue</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
