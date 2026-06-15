import { ShieldCheck, Printer, Check, MinusCircle, Activity, Star, Clock, FileText } from 'lucide-react'
import { useBrands, useRateFacts, useRateChecks, useReviewProfiles, useLatestScanResults } from '../lib/hooks'

// TRQ-71 — Compliance scorecard + vendor-risk one-pager.
// The artifact that gets Tracque through procurement at a credit union / lender.
// UI-only: reads existing client-scoped hooks (rate_checks, review_profiles,
// latest_scan_results). No new data sources, no decisioning.

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function freshnessScore(days: number | null): number | null {
  if (days == null) return null
  if (days <= 7) return 100
  if (days <= 14) return 85
  if (days <= 30) return 65
  if (days <= 60) return 40
  return 20
}

function grade(score: number | null): { letter: string; color: string } {
  if (score == null) return { letter: '—', color: 'text-muted-foreground' }
  if (score >= 90) return { letter: 'A', color: 'text-emerald-600' }
  if (score >= 80) return { letter: 'B', color: 'text-emerald-600' }
  if (score >= 70) return { letter: 'C', color: 'text-amber-600' }
  if (score >= 60) return { letter: 'D', color: 'text-amber-600' }
  return { letter: 'F', color: 'text-red-600' }
}

function ScoreCard({ icon: Icon, label, score, detail, foot }: {
  icon: typeof Activity; label: string; score: number | null; detail: string; foot: string
}) {
  const pct = score == null ? null : Math.round(score)
  const bar = pct == null ? 0 : pct
  const tone = pct == null ? 'bg-muted-foreground/30'
    : pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-[11px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold nums">{pct == null ? '—' : `${pct}`}</span>
        {pct != null && <span className="text-sm text-muted-foreground">%</span>}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${bar}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">{foot}</p>
    </div>
  )
}

export default function Compliance() {
  const { data: brands = [] } = useBrands()
  const ownBrand = brands.find(b => b.type === 'own') ?? brands[0]
  const { data: facts = [] } = useRateFacts(ownBrand?.id)
  const { data: checks = [] } = useRateChecks(ownBrand?.id)
  const { data: profiles = [] } = useReviewProfiles()
  const { data: scans = [] } = useLatestScanResults()

  // ── Rate accuracy ────────────────────────────────────────
  const accurate = checks.filter(c => c.status === 'accurate').length
  const wrong = checks.filter(c => c.status === 'wrong').length
  const checked = accurate + wrong
  const rateScore = checked ? (accurate / checked) * 100 : null

  // ── Review response rate (own profiles, weighted by volume) ─
  const ownProfiles = profiles.filter(p => p.type === 'own' && p.response_rate != null)
  const respWeight = ownProfiles.reduce((s, p) => s + (p.reviews_count ?? 0), 0)
  const responseScore = ownProfiles.length
    ? (respWeight > 0
        ? ownProfiles.reduce((s, p) => s + (p.response_rate ?? 0) * (p.reviews_count ?? 0), 0) / respWeight
        : ownProfiles.reduce((s, p) => s + (p.response_rate ?? 0), 0) / ownProfiles.length) * 100
    : null

  // ── Citation freshness (most recent AI visibility scan) ────
  const lastScan = scans.reduce<string | null>((latest, s) =>
    !latest || (s.scanned_at && s.scanned_at > latest) ? s.scanned_at : latest, null)
  const staleDays = daysSince(lastScan)
  const freshScore = freshnessScore(staleDays)

  // ── Overall grade (mean of available sub-scores) ───────────
  const subs = [rateScore, responseScore, freshScore].filter((s): s is number => s != null)
  const overall = subs.length ? subs.reduce((a, b) => a + b, 0) / subs.length : null
  const g = grade(overall)

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const respPct = responseScore == null ? null : Math.round(responseScore)

  return (
    <div className="p-6 space-y-6">
      {/* Print rule: only the one-pager prints */}
      <style>{`@media print {
        body * { visibility: hidden; }
        #vendor-onepager, #vendor-onepager * { visibility: visible; }
        #vendor-onepager { position: absolute; top: 0; left: 0; width: 100%; padding: 0; }
        @page { margin: 1.4cm; }
      }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-600" /></div>
          <div>
            <h1 className="text-xl font-semibold">Compliance</h1>
            <p className="text-xs text-muted-foreground">Vendor-risk scorecard + printable one-pager for procurement &amp; exam files</p>
          </div>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium">
          <Printer className="w-4 h-4" /> Print one-pager
        </button>
      </div>

      {!ownBrand ? (
        <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center print:hidden">
          <p className="text-sm text-muted-foreground">Add your institution under <span className="font-medium text-foreground">Brands</span> to generate a compliance scorecard.</p>
        </div>
      ) : (
        <>
          {/* Overall grade banner */}
          <div className="bg-card rounded-xl border border-border shadow-card p-5 flex items-center gap-5 print:hidden">
            <div className="w-20 h-20 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
              <span className={`text-5xl font-bold ${g.color}`}>{g.letter}</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Overall AI-compliance posture</p>
              <p className="text-lg font-semibold mt-0.5">
                {overall == null ? 'Not enough data yet' : `${Math.round(overall)} / 100 — ${ownBrand.name}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Blends AI rate-accuracy, review responsiveness, and citation freshness. Monitoring only — Tracque never publishes a rate or makes a lending decision.
              </p>
            </div>
          </div>

          {/* Scorecard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <ScoreCard icon={Activity} label="AI rate accuracy" score={rateScore}
              detail={checked ? `${accurate}/${checked} facts stated correctly by AI` : 'No AI checks run yet'}
              foot={`${facts.length} ground-truth fact${facts.length === 1 ? '' : 's'} monitored · ${wrong} flagged wrong`} />
            <ScoreCard icon={Star} label="Review response rate" score={responseScore}
              detail={respPct == null ? 'No review profiles synced' : `${respPct}% of reviews answered`}
              foot={ownProfiles.length ? `Across ${ownProfiles.length} platform${ownProfiles.length === 1 ? '' : 's'}` : 'Sync Reputation to populate'} />
            <ScoreCard icon={Clock} label="Citation freshness" score={freshScore}
              detail={staleDays == null ? 'No AI scans yet' : staleDays === 0 ? 'Scanned today' : `Last scanned ${staleDays}d ago`}
              foot="How current our AI-visibility evidence is" />
          </div>

          {/* Wrong-fact callout (the procurement red flag to fix first) */}
          {wrong > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 print:hidden">
              <p className="text-sm font-semibold text-red-700">{wrong} fact{wrong > 1 ? 's' : ''} currently misstated by AI</p>
              <p className="text-xs text-red-600 mt-0.5">Resolve these on AI Rate Accuracy before sharing the one-pager — a clean rate-accuracy row is the strongest line in a vendor-risk packet.</p>
            </div>
          )}

          {/* ── Printable vendor-risk one-pager ─────────────── */}
          <div id="vendor-onepager" className="bg-card rounded-xl border border-border shadow-card p-8 max-w-3xl mx-auto print:border-0 print:shadow-none print:max-w-none">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Vendor Risk Summary</p>
                <h2 className="text-2xl font-bold mt-1">{ownBrand.name}</h2>
                {ownBrand.domain && <p className="text-sm text-muted-foreground">{ownBrand.domain}</p>}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end text-foreground">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold">Tracque</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">AI-visibility &amp; rate-accuracy monitoring</p>
                <p className="text-[11px] text-muted-foreground">Prepared {today}</p>
              </div>
            </div>

            {/* Live metrics at a glance */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-border">
              {[
                { k: 'Posture', v: g.letter, s: overall == null ? '' : `${Math.round(overall)}/100` },
                { k: 'Rate accuracy', v: rateScore == null ? '—' : `${Math.round(rateScore)}%`, s: `${checked} checked` },
                { k: 'Review response', v: respPct == null ? '—' : `${respPct}%`, s: `${ownProfiles.length} platforms` },
                { k: 'Evidence age', v: staleDays == null ? '—' : `${staleDays}d`, s: 'last scan' },
              ].map(m => (
                <div key={m.k}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.k}</p>
                  <p className="text-xl font-bold mt-0.5">{m.v}</p>
                  <p className="text-[10px] text-muted-foreground">{m.s}</p>
                </div>
              ))}
            </div>

            {/* Vendor-risk sections */}
            <div className="py-5 space-y-4 text-sm leading-relaxed">
              {[
                {
                  icon: FileText, title: 'Service & model ownership',
                  body: 'Tracque monitors how third-party public AI engines (ChatGPT, Claude, Gemini, Perplexity, Grok) and search engines represent the institution. Tracque does not train, fine-tune, or own these models, and does not use the institution’s data to train any model. It is a read-only observability layer.',
                },
                {
                  icon: ShieldCheck, title: 'No decisioning · out of model-risk scope',
                  body: 'Tracque is monitoring-only. It never originates, prices, or decisions loans, deposits, or memberships, and never auto-publishes a rate. Ground-truth rates and fees are entered by institution staff and are used solely to diff against what AI states. This keeps Tracque outside fair-lending / UDAAP model-risk decisioning scope.',
                },
                {
                  icon: Activity, title: 'Accuracy methodology',
                  body: `For each institution-provided fact (rate, fee, hours, eligibility), Tracque probes AI engines for what they currently state about the institution and classifies each as accurate, wrong, or not-stated against the ground-truth value. Misstatements are surfaced for staff to correct at the source. Current pass rate: ${rateScore == null ? 'pending first scan' : `${Math.round(rateScore)}% (${accurate}/${checked || 0} facts)`}.`,
                },
                {
                  icon: MinusCircle, title: 'Data handling & PII',
                  body: 'Tracque ingests only public web/AI content and institution-provided non-sensitive business facts (published rates, hours, review responses). It collects no consumer PII, no account data, and no credentials. Member-facing analytics are first-party and aggregate. Data is tenant-isolated per client with row-level security.',
                },
              ].map(s => (
                <div key={s.title} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <s.icon className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-muted-foreground mt-0.5">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attestation row */}
            <div className="pt-4 border-t border-border grid grid-cols-3 gap-3 text-xs">
              {[
                { l: 'Monitoring only', d: 'No decisioning' },
                { l: 'No consumer PII', d: 'Public + provided facts' },
                { l: 'Tenant-isolated', d: 'Row-level security' },
              ].map(a => (
                <div key={a.l} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{a.l}</p>
                    <p className="text-muted-foreground">{a.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              Generated by Tracque for {ownBrand.name}. Live metrics reflect the most recent scans as of {today}. This summary is informational and does not constitute legal, compliance, or regulatory advice.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
