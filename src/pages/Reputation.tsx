import { useState } from 'react'
import { Star, Loader2, RefreshCw, Trophy, MessageSquare, ShieldCheck, AlertTriangle, Sparkles, Reply } from 'lucide-react'
import { useBrands, useReviewProfiles, useLocalCompetitors, useRunReputationSync, useReviews, useRunReviewsSync, useDraftReply, type Review } from '../lib/hooks'

function ReviewCard({ review, businessName }: { review: Review; businessName: string }) {
  const draft = useDraftReply()
  const [reply, setReply] = useState<string | null>(null)
  async function generate() {
    const r = await draft.mutateAsync({ review_text: review.text ?? '', rating: review.rating ?? undefined, business_name: businessName })
    setReply(r)
  }
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{review.author ?? 'Anonymous'}</span>
          <Stars rating={review.rating} size="w-3 h-3" />
        </div>
        <div className="flex items-center gap-2">
          {review.owner_answered
            ? <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">replied</span>
            : <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded">needs reply</span>}
          <span className="text-xs text-muted-foreground">{review.posted_at}</span>
        </div>
      </div>
      {review.text && <p className="text-sm text-muted-foreground">{review.text}</p>}
      {!review.owner_answered && (
        <div className="mt-2">
          {!reply ? (
            <button onClick={generate} disabled={draft.isPending} className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50">
              {draft.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Draft AI reply
            </button>
          ) : (
            <div className="bg-muted/40 rounded-lg p-2.5 mt-1">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Suggested reply</p>
              <p className="text-sm">{reply}</p>
              <button onClick={() => navigator.clipboard.writeText(reply)} className="text-xs text-primary hover:underline mt-1">Copy</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const THRESHOLD = 4.3 // AI models favor ~4.3+ stars; exclude near 3.4
const MIN_REVIEWS = 10

function Stars({ rating, size = 'w-4 h-4' }: { rating: number | null; size?: string }) {
  const r = rating ?? 0
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
      ))}
    </div>
  )
}

export default function Reputation() {
  const { data: brands = [] } = useBrands()
  const { data: profiles = [] } = useReviewProfiles()
  const runSync = useRunReputationSync()

  const ownBrand = brands.find(b => b.type === 'own') ?? brands[0]
  const { data: competitors = [] } = useLocalCompetitors(ownBrand?.id)
  const { data: reviews = [] } = useReviews(ownBrand?.id)
  const runReviews = useRunReviewsSync()
  const google = profiles.find(p => p.brand_id === ownBrand?.id && p.platform === 'google')

  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')

  const rating = google?.rating ?? null
  const reviews = google?.reviews_count ?? 0
  const recommendable = rating != null && rating >= THRESHOLD && reviews >= MIN_REVIEWS
  const starGap = rating != null ? Math.max(0, +(THRESHOLD - rating).toFixed(1)) : null
  const rank = competitors.length ? competitors.findIndex(c => c.is_self) + 1 : 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><Star className="w-4 h-4 text-amber-600" /></div>
          <div>
            <h1 className="text-xl font-semibold">Reputation</h1>
            <p className="text-xs text-muted-foreground">Reviews drive what AI recommends — track your rating vs the local field</p>
          </div>
        </div>
      </div>

      {/* Scan controls */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="plumber, credit union…" className="mt-1 w-48 px-3 py-2 text-sm border border-border rounded-lg bg-background" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">City or address</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Austin, TX" className="mt-1 w-44 px-3 py-2 text-sm border border-border rounded-lg bg-background" />
          </div>
          <button
            onClick={() => ownBrand && runSync.mutate({ brand_id: ownBrand.id, category: category || undefined, location: location || undefined })}
            disabled={runSync.isPending || !ownBrand}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {runSync.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {runSync.isPending ? 'Scanning…' : 'Run reputation scan'}
          </button>
        </div>
        {!ownBrand && <p className="text-xs text-muted-foreground mt-2">Add a brand (type: own) first.</p>}
      </div>

      {/* Score + AI-recommendable gauge */}
      {google && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Google rating</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold nums">{rating?.toFixed(1) ?? '—'}</p>
              <div className="mb-1"><Stars rating={rating} /></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {reviews.toLocaleString()} reviews</p>
          </div>

          <div className={`rounded-xl border p-5 shadow-card ${recommendable ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">AI-recommendable?</p>
            {recommendable ? (
              <div className="flex items-center gap-2 text-emerald-700"><ShieldCheck className="w-5 h-5" /><p className="font-semibold">Yes — above threshold</p></div>
            ) : (
              <div className="flex items-start gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  {rating == null ? 'Run a scan to measure.'
                    : starGap && starGap > 0 ? `${starGap}★ below the ${THRESHOLD} bar AI favors.`
                    : reviews < MIN_REVIEWS ? `Need ${MIN_REVIEWS - reviews} more reviews to clear the volume bar.`
                    : 'Just under the recommendation threshold.'}
                </p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">AI engines favor ~{THRESHOLD}★ with {MIN_REVIEWS}+ reviews; they exclude near 3.4★.</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Local rank</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold nums">{rank ? `#${rank}` : '—'}</p>
              <p className="text-xs text-muted-foreground mb-1">of {competitors.length}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Trophy className="w-3 h-3" /> by rating in your area</p>
          </div>
        </div>
      )}

      {/* Aspect topics */}
      {google?.topics && google.topics.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 shadow-card">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3">What customers mention</p>
          <div className="flex flex-wrap gap-2">
            {google.topics.map(t => (
              <span key={t.topic} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">{t.topic} <span className="text-muted-foreground nums">{t.count}</span></span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews + AI-drafted replies */}
      {google && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Recent reviews{google.response_rate != null && <span className="text-foreground"> · {Math.round(google.response_rate * 100)}% response rate</span>}
            </p>
            <button onClick={() => ownBrand && runReviews.mutate(ownBrand.id)} disabled={runReviews.isPending}
              className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-muted/40 disabled:opacity-50">
              {runReviews.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Reply className="w-3.5 h-3.5" />}
              {runReviews.isPending ? 'Loading reviews…' : 'Load reviews'}
            </button>
          </div>
          {(runReviews.data as any)?.pending && <p className="text-xs text-amber-600 mb-2">Reviews still processing — click again in a few seconds.</p>}
          {reviews.length > 0 && (
            <div className="space-y-2">
              {reviews.map(r => <ReviewCard key={r.id} review={r} businessName={ownBrand?.name ?? google.brand_name} />)}
            </div>
          )}
        </div>
      )}

      {/* Local competitor grid */}
      {competitors.length > 0 && (
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Share of local voice · {competitors.length} businesses</p>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['#', 'Business', 'Rating', 'Reviews', 'Claimed'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr key={c.id} className={`border-b border-border last:border-0 transition-colors ${c.is_self ? 'bg-blue-50/50' : 'hover:bg-muted/20'}`}>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate max-w-[260px]">{c.name}</span>
                        {c.is_self && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">YOU</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-1.5"><span className="text-sm font-semibold nums">{c.rating?.toFixed(1) ?? '—'}</span><Star className="w-3 h-3 text-amber-400 fill-amber-400" /></div></td>
                    <td className="px-4 py-2.5 text-xs nums text-muted-foreground">{c.reviews_count?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-2.5">{c.is_claimed ? <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">claimed</span> : <span className="text-xs text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!google && competitors.length === 0 && (
        <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
          <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No reputation data yet</p>
          <p className="text-xs mt-1">Run a scan with your category + location to pull ratings and the local competitive set.</p>
        </div>
      )}
    </div>
  )
}
