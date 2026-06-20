import { Bot, Search, Star, BarChart3 } from 'lucide-react'
import { Mark } from './Logo'

// TRQ-12 — White-label client report. Pure presentation: the authed page
// (Report.tsx) and the public page (SharedReport.tsx) both feed it this
// exact shape, so they render identically.

export interface ReportData {
  brand: { name: string; domain: string | null; color: string; logo_url: string | null }
  ai: { mention_rate: number | null; scans: number; models: { model: string; rate: number }[] }
  seo: { tracked: number; avg_position: number | null; top3: number; top10: number }
  reputation: { rating: number | null; reviews: number; platforms: { platform: string; rating: number | null; count: number }[] }
  attribution: { visitors: number; conversions: number; revenue: number; ai_share: number | null }
  generated_at: string
}

const MODEL_LABEL: Record<string, string> = {
  chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Gemini', grok: 'Grok', perplexity: 'Perplexity', copilot: 'Copilot',
}
const fmt = (n: number) => n.toLocaleString()
const money = (n: number) => '$' + Math.round(n).toLocaleString()

function Section({ icon: Icon, title, children }: { icon: typeof Bot; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-card p-5 break-inside-avoid">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <p className="eyebrow text-muted-foreground">{title}</p>
      </div>
      {children}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-2xl font-display font-bold nums tracking-tight">{value}</p>
      <p className="eyebrow text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

export default function ReportView({ data }: { data: ReportData }) {
  const { brand, ai, seo, reputation, attribution } = data
  const accent = brand.color || '#2D7FF9'
  const date = new Date(data.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div id="report-doc" className="space-y-4">
      {/* Branded header */}
      <div className="bg-card rounded-2xl border border-border shadow-card p-6 flex items-center justify-between break-inside-avoid"
        style={{ borderTopWidth: 3, borderTopColor: accent }}>
        <div className="flex items-center gap-3">
          {brand.logo_url
            ? <img src={brand.logo_url} alt="" className="w-11 h-11 rounded-xl object-contain bg-muted" />
            : <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-display font-bold text-white" style={{ background: accent }}>{brand.name.charAt(0).toUpperCase()}</div>}
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight">{brand.name}</h1>
            <p className="text-xs text-muted-foreground">{brand.domain ?? 'AI visibility & growth report'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="eyebrow text-primary">Performance report</p>
          <p className="text-sm font-medium mt-1">{date}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Visibility */}
        <Section icon={Bot} title="AI Visibility">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-display font-bold nums tracking-tight">{ai.mention_rate == null ? '—' : ai.mention_rate}</span>
            {ai.mention_rate != null && <span className="text-lg font-display text-muted-foreground">%</span>}
          </div>
          <p className="text-xs text-muted-foreground">mention rate across {fmt(ai.scans)} AI scans</p>
          {ai.models.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {ai.models.map(m => (
                <div key={m.model} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-muted-foreground">{MODEL_LABEL[m.model] ?? m.model}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${m.rate}%` }} />
                  </div>
                  <span className="text-xs nums w-8 text-right">{m.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* SEO */}
        <Section icon={Search} title="SEO Rankings">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Tracked" value={fmt(seo.tracked)} />
            <Stat label="Avg pos" value={seo.avg_position == null ? '—' : `${seo.avg_position}`} />
            <Stat label="Top 3" value={fmt(seo.top3)} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">{seo.top10} keyword{seo.top10 === 1 ? '' : 's'} on page one</p>
        </Section>

        {/* Reputation */}
        <Section icon={Star} title="Reputation">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-display font-bold nums tracking-tight">{reputation.rating == null ? '—' : reputation.rating.toFixed(1)}</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-muted-foreground">avg rating · {fmt(reputation.reviews)} reviews</p>
          {reputation.platforms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {reputation.platforms.map(p => (
                <span key={p.platform} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-foreground capitalize">
                  {p.platform} {p.rating != null ? `${p.rating.toFixed(1)}★` : ''} <span className="text-muted-foreground">({fmt(p.count)})</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Attribution */}
        <Section icon={BarChart3} title="Revenue Attribution">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Visitors" value={fmt(attribution.visitors)} />
            <Stat label="Conversions" value={fmt(attribution.conversions)} />
            <Stat label="Revenue" value={money(attribution.revenue)} />
          </div>
          {attribution.ai_share != null && (
            <p className="text-[11px] text-muted-foreground mt-3">
              <span className="font-semibold text-foreground">{attribution.ai_share}%</span> of traffic sourced from AI engines
            </p>
          )}
        </Section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
        <Mark className="w-3.5 h-3.5" badge="#2D7FF9" rail="#fff" node="#2D7FF9" />
        Powered by Tracque
      </div>
    </div>
  )
}
