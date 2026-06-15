// Tracque — Public white-label report (TRQ-12)
//
// The ONLY public read path for a client report. Deployed --no-verify-jwt
// (like the `track` beacon). Trust boundary rules:
//   • Caller supplies ONLY an opaque token. Never a client_id/user_id.
//   • token → client_reports row (enabled) → client_id + user_id, derived
//     SERVER-SIDE. Every aggregate below is filtered by that derived id.
//   • Unknown/disabled token → 404 (don't leak which tokens exist).
//   • The response carries branding + aggregates ONLY — never the raw
//     user_id/client_id/token.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const body = await req.json().catch(() => null)
  const token = typeof body?.token === 'string' ? body.token.trim() : ''
  if (!token || token.length < 12) return json({ error: 'not found' }, 404)

  // Resolve the token → owner + client, SERVER-SIDE. This is the only place
  // a client_id enters the request; the caller cannot influence it.
  const { data: link } = await supabase
    .from('client_reports').select('client_id, user_id, enabled').eq('token', token).maybeSingle()
  if (!link || !link.enabled) return json({ error: 'not found' }, 404)

  const clientId = link.client_id as string
  const userId = link.user_id as string

  const { data: client } = await supabase
    .from('clients').select('name, domain, color, logo_url').eq('id', clientId).eq('user_id', userId).maybeSingle()
  if (!client) return json({ error: 'not found' }, 404)

  // Helper: every query is hard-scoped to the resolved (clientId, userId).
  const scoped = (table: string) => supabase.from(table).select('*').eq('client_id', clientId).eq('user_id', userId)

  // ── AI visibility (mention_rates) ─────────────────────────
  const { data: mr = [] } = await scoped('mention_rates')
  const rows = mr ?? []
  // The mention_rates view exposes total_runs / total_mentions (per brand+model).
  const totalScans = rows.reduce((s: number, r: any) => s + Number(r.total_runs ?? 0), 0)
  const totalMentions = rows.reduce((s: number, r: any) => s + Number(r.total_mentions ?? 0), 0)
  const byModel = new Map<string, { scans: number; mentions: number }>()
  for (const r of rows) {
    const m = byModel.get(r.model) ?? { scans: 0, mentions: 0 }
    m.scans += Number(r.total_runs ?? 0); m.mentions += Number(r.total_mentions ?? 0)
    byModel.set(r.model, m)
  }
  const ai = {
    mention_rate: totalScans ? Math.round((totalMentions / totalScans) * 100) : null,
    scans: totalScans,
    models: [...byModel.entries()].map(([model, v]) => ({ model, rate: v.scans ? Math.round((v.mentions / v.scans) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate),
  }

  // ── SEO (latest_seo_results) ──────────────────────────────
  // latest_seo_results has no user_id column; client_id scoping is sufficient
  // and the client_id itself is owner-derived from the token.
  const { data: seoRows = [] } = await supabase
    .from('latest_seo_results').select('position').eq('client_id', clientId)
  const positions = (seoRows ?? []).map((r: any) => r.position).filter((p: any): p is number => typeof p === 'number')
  const seo = {
    tracked: (seoRows ?? []).length,
    avg_position: positions.length ? Math.round((positions.reduce((a, b) => a + b, 0) / positions.length) * 10) / 10 : null,
    top3: positions.filter(p => p <= 3).length,
    top10: positions.filter(p => p <= 10).length,
  }

  // ── Reputation (review_profiles_scoped, own brand only) ───
  const { data: profRows = [] } = await supabase
    .from('review_profiles_scoped').select('*').eq('client_id', clientId).eq('user_id', userId).eq('type', 'own')
  const profs = (profRows ?? []).filter((p: any) => p.rating != null)
  const repWeight = profs.reduce((s: number, p: any) => s + (p.reviews_count ?? 0), 0)
  const reputation = {
    rating: profs.length
      ? Math.round((repWeight > 0
          ? profs.reduce((s: number, p: any) => s + p.rating * (p.reviews_count ?? 0), 0) / repWeight
          : profs.reduce((s: number, p: any) => s + p.rating, 0) / profs.length) * 10) / 10
      : null,
    reviews: (profRows ?? []).reduce((s: number, p: any) => s + (p.reviews_count ?? 0), 0),
    platforms: (profRows ?? []).map((p: any) => ({ platform: p.platform, rating: p.rating, count: p.reviews_count ?? 0 })),
  }

  // ── Attribution (attribution_by_source) ───────────────────
  const { data: attrRows = [] } = await scoped('attribution_by_source')
  const attr = attrRows ?? []
  const visitors = attr.reduce((s: number, r: any) => s + (r.visitors ?? 0), 0)
  const conversions = attr.reduce((s: number, r: any) => s + (r.conversions ?? 0), 0)
  const revenue = attr.reduce((s: number, r: any) => s + (r.revenue ?? 0), 0)
  const aiVisitors = attr.filter((r: any) => r.is_ai).reduce((s: number, r: any) => s + (r.visitors ?? 0), 0)
  const attribution = {
    visitors, conversions, revenue,
    ai_share: visitors ? Math.round((aiVisitors / visitors) * 100) : null,
  }

  return json({
    brand: { name: client.name, domain: client.domain, color: client.color ?? '#3B82F6', logo_url: client.logo_url ?? null },
    ai, seo, reputation, attribution,
    generated_at: new Date().toISOString(),
  })
})
