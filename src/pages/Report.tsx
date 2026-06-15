import { useMemo, useState } from 'react'
import { FileBarChart, Printer, Link2, Copy, Check, Loader2, Eye, EyeOff } from 'lucide-react'
import { useClients, useMentionRates, useLatestSeoResults, useReviewProfiles, useAttributionBySource, useShareLink, useCreateShareLink, useToggleShareLink } from '../lib/hooks'
import { useSelectedClient } from '../lib/clientContext'
import ReportView, { type ReportData } from '../components/ReportView'

// TRQ-12 — White-label client report (authed view). Aggregates the selected
// client's data from the existing client-scoped hooks into the shared
// ReportView, plus a per-client public share-link manager.

export default function Report() {
  const { clientId } = useSelectedClient()
  const { data: clients = [] } = useClients()
  const { data: mr = [] } = useMentionRates()
  const { data: seo = [] } = useLatestSeoResults()
  const { data: profiles = [] } = useReviewProfiles()
  const { data: attr = [] } = useAttributionBySource()

  const specific = clientId !== 'all'
  const client = clients.find(c => c.id === clientId)

  const { data: link } = useShareLink(specific ? clientId : undefined)
  const createLink = useCreateShareLink()
  const toggleLink = useToggleShareLink()
  const [copied, setCopied] = useState(false)

  const data = useMemo<ReportData>(() => {
    // AI visibility — the mention_rates view exposes total_runs / total_mentions
    // (the TS Row type names them total_scans/mentions; read the real columns).
    const mrRows = mr as unknown as { model: string; total_runs?: number; total_mentions?: number }[]
    const totalScans = mrRows.reduce((s, r) => s + Number(r.total_runs ?? 0), 0)
    const totalMentions = mrRows.reduce((s, r) => s + Number(r.total_mentions ?? 0), 0)
    const byModel = new Map<string, { scans: number; mentions: number }>()
    for (const r of mrRows) {
      const m = byModel.get(r.model) ?? { scans: 0, mentions: 0 }
      m.scans += Number(r.total_runs ?? 0); m.mentions += Number(r.total_mentions ?? 0)
      byModel.set(r.model, m)
    }
    // SEO
    const positions = seo.map(r => r.position).filter((p): p is number => typeof p === 'number')
    // Reputation — own brand only, matching the public edge fn exactly so the
    // agency preview equals the client-facing report (competitor profiles excluded).
    const ownAll = profiles.filter(p => p.type === 'own')
    const ownRated = ownAll.filter(p => p.rating != null)
    const repWeight = ownRated.reduce((s, p) => s + (p.reviews_count ?? 0), 0)
    // Attribution
    const visitors = attr.reduce((s, r) => s + (r.visitors ?? 0), 0)
    const aiVisitors = attr.filter(r => r.is_ai).reduce((s, r) => s + (r.visitors ?? 0), 0)

    return {
      brand: {
        name: specific ? (client?.name ?? 'Client') : 'All clients',
        domain: specific ? (client?.domain ?? null) : null,
        color: specific ? (client?.color ?? '#3B82F6') : '#3B82F6',
        logo_url: (client as { logo_url?: string | null } | undefined)?.logo_url ?? null,
      },
      ai: {
        mention_rate: totalScans ? Math.round((totalMentions / totalScans) * 100) : null,
        scans: totalScans,
        models: [...byModel.entries()].map(([model, v]) => ({ model, rate: v.scans ? Math.round((v.mentions / v.scans) * 100) : 0 })).sort((a, b) => b.rate - a.rate),
      },
      seo: {
        tracked: seo.length,
        avg_position: positions.length ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : null,
        top3: positions.filter(p => p <= 3).length,
        top10: positions.filter(p => p <= 10).length,
      },
      reputation: {
        rating: ownRated.length ? Math.round((repWeight > 0
          ? ownRated.reduce((s, p) => s + (p.rating ?? 0) * (p.reviews_count ?? 0), 0) / repWeight
          : ownRated.reduce((s, p) => s + (p.rating ?? 0), 0) / ownRated.length) * 10) / 10 : null,
        reviews: ownAll.reduce((s, p) => s + (p.reviews_count ?? 0), 0),
        platforms: ownAll.map(p => ({ platform: p.platform, rating: p.rating, count: p.reviews_count ?? 0 })),
      },
      attribution: {
        visitors,
        conversions: attr.reduce((s, r) => s + (r.conversions ?? 0), 0),
        revenue: attr.reduce((s, r) => s + (r.revenue ?? 0), 0),
        ai_share: visitors ? Math.round((aiVisitors / visitors) * 100) : null,
      },
      generated_at: new Date().toISOString(),
    }
  }, [mr, seo, profiles, attr, specific, client])

  const shareUrl = link ? `${window.location.origin}/r/${link.token}` : ''
  function copy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
  }

  return (
    <div className="p-6 space-y-5">
      <style>{`@media print {
        body * { visibility: hidden; }
        #report-doc, #report-doc * { visibility: visible; }
        #report-doc { position: absolute; top: 0; left: 0; width: 100%; }
        @page { margin: 1.2cm; }
      }`}</style>

      {/* Header / actions */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center"><FileBarChart className="w-4 h-4 text-indigo-600" /></div>
          <div>
            <h1 className="text-xl font-semibold">Client Report</h1>
            <p className="text-xs text-muted-foreground">Branded, shareable scorecard — AI visibility, SEO, reputation &amp; revenue</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Share-link manager (per specific client only) */}
      {specific ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-4 print:hidden">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Public share link</span>
          </div>
          {!link ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Generate a read-only link to hand this client — no login required.</p>
              <button onClick={() => createLink.mutate(clientId)} disabled={createLink.isPending}
                className="flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {createLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />} Generate link
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input readOnly value={link.enabled ? shareUrl : 'Link disabled'} onFocus={e => e.target.select()}
                className={`flex-1 min-w-[260px] px-3 py-1.5 text-sm border border-border rounded-lg bg-muted/30 font-mono ${link.enabled ? '' : 'text-muted-foreground line-through'}`} />
              <button onClick={copy} disabled={!link.enabled} className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-muted">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={() => toggleLink.mutate({ id: link.id, enabled: !link.enabled })} disabled={toggleLink.isPending}
                className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50">
                {link.enabled ? <><EyeOff className="w-3.5 h-3.5" /> Disable</> : <><Eye className="w-3.5 h-3.5" /> Enable</>}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted/40 border border-border rounded-xl p-3 text-xs text-muted-foreground print:hidden">
          Showing an aggregate across all clients. Select a specific client in the switcher to apply its branding and create a shareable link.
        </div>
      )}

      <ReportView data={data} />
    </div>
  )
}
