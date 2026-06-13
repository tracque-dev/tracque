// Tracque — SEO Sync
// Populates the SEO suite with Ahrefs-grade data:
//   • Rank tracking      → SerpAPI (real Google SERP → your position)
//   • Keyword metrics    → DataForSEO Labs (volume, difficulty, CPC, trend)
//   • Domain authority   → DataForSEO (DR, organic traffic, ref domains)
//   • Backlinks          → DataForSEO Backlinks
//
// Degrades gracefully: with only SERP_API_KEY you still get live rank
// tracking; DataForSEO unlocks the keyword/backlink/authority metrics.
//
// Secrets:
//   SERP_API_KEY
//   DATAFORSEO_LOGIN  /  DATAFORSEO_PASSWORD

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const SERP_API_KEY = Deno.env.get('SERP_API_KEY')
const DFS_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DFS_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')

const US = { location_code: 2840, language_code: 'en' }
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }

function rootDomain(d: string): string {
  return d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase()
}

// ── SerpAPI: live Google rank for a query ──────────────────
async function serpRank(phrase: string, domain: string): Promise<{ position: number | null; url: string | null }> {
  if (!SERP_API_KEY) return { position: null, url: null }
  const params = new URLSearchParams({ engine: 'google', q: phrase, num: '100', api_key: SERP_API_KEY, gl: 'us', hl: 'en' })
  const res = await fetch(`https://serpapi.com/search?${params}`)
  if (!res.ok) return { position: null, url: null }
  const data = await res.json()
  const target = rootDomain(domain)
  const organic = data.organic_results ?? []
  for (const r of organic) {
    const link = r.link ?? ''
    if (rootDomain(link).includes(target) || target.includes(rootDomain(link))) {
      return { position: r.position ?? null, url: link || null }
    }
  }
  return { position: null, url: null }
}

// ── DataForSEO plumbing ────────────────────────────────────
function dfsAuth(): string | null {
  if (!DFS_LOGIN || !DFS_PASSWORD) return null
  return 'Basic ' + btoa(`${DFS_LOGIN}:${DFS_PASSWORD}`)
}

async function dfsPost(path: string, task: Record<string, unknown>): Promise<any> {
  const auth = dfsAuth()
  if (!auth) return null
  const res = await fetch(`https://api.dataforseo.com/v3/${path}`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify([task]),
  })
  if (!res.ok) return null
  const json = await res.json()
  return json?.tasks?.[0]?.result ?? null
}

// Keyword overview: volume, difficulty, cpc, monthly trend.
async function dfsKeywordMetrics(phrases: string[]): Promise<Map<string, any>> {
  const out = new Map<string, any>()
  if (!dfsAuth() || !phrases.length) return out
  const result = await dfsPost('dataforseo_labs/google/keyword_overview/live', { keywords: phrases.slice(0, 700), ...US })
  for (const item of result?.[0]?.items ?? []) {
    const ki = item.keyword_info ?? {}
    out.set((item.keyword ?? '').toLowerCase(), {
      search_volume: ki.search_volume ?? null,
      cpc: ki.cpc ?? null,
      competition: ki.competition ?? null,
      difficulty: item.keyword_properties?.keyword_difficulty ?? null,
      trend: (ki.monthly_searches ?? []).map((m: any) => ({ month: `${m.year}-${m.month}`, volume: m.search_volume })),
    })
  }
  return out
}

// Domain overview: organic traffic + ranking keyword count.
async function dfsDomainOverview(domain: string): Promise<{ organic_traffic: number | null; organic_keywords: number | null }> {
  const result = await dfsPost('dataforseo_labs/google/domain_rank_overview/live', { target: rootDomain(domain), ...US })
  const organic = result?.[0]?.items?.[0]?.metrics?.organic ?? {}
  return { organic_traffic: Math.round(organic.etv ?? 0) || null, organic_keywords: organic.count ?? null }
}

// Backlink summary: referring domains, total backlinks, authority rank.
async function dfsBacklinkSummary(domain: string): Promise<{ referring_domains: number | null; backlinks_total: number | null; domain_rating: number | null }> {
  const result = await dfsPost('backlinks/summary/live', { target: rootDomain(domain), internal_list_limit: 10, backlinks_status_type: 'live' })
  const r = result?.[0] ?? {}
  return {
    referring_domains: r.referring_domains ?? null,
    backlinks_total: r.backlinks ?? null,
    domain_rating: r.rank != null ? Math.round(r.rank / 10) : null, // DFS rank 0–1000 → 0–100
  }
}

// Top backlinks list.
async function dfsBacklinks(domain: string): Promise<any[]> {
  const result = await dfsPost('backlinks/backlinks/live', { target: rootDomain(domain), limit: 25, mode: 'as_is', order_by: ['rank,desc'], backlinks_status_type: 'live' })
  return (result?.[0]?.items ?? []).map((b: any) => ({
    source_domain: b.domain_from ?? null,
    source_url: b.url_from ?? null,
    target_url: b.url_to ?? null,
    anchor: b.anchor ?? null,
    domain_rating: b.rank != null ? Math.round(b.rank / 10) : null,
    dofollow: b.dofollow ?? true,
    first_seen: b.first_seen ? b.first_seen.slice(0, 10) : null,
  }))
}

// ── Main ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const { user_id, brand_ids, keyword_ids } = await req.json().catch(() => ({}))
  if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: cors })

  // Load brands (must have a domain) + keywords.
  let bq = supabase.from('brands').select('id, name, domain, type').eq('user_id', user_id).not('domain', 'is', null)
  if (brand_ids?.length) bq = bq.in('id', brand_ids)
  const { data: brands } = await bq

  let kq = supabase.from('keywords').select('id, phrase').eq('user_id', user_id)
  if (keyword_ids?.length) kq = kq.in('id', keyword_ids)
  const { data: keywords } = await kq

  if (!brands?.length || !keywords?.length) {
    return new Response(JSON.stringify({ ok: true, ranks: 0, note: 'need at least one brand with a domain and one keyword' }), { headers: cors })
  }

  // 1) Keyword metrics (once per keyword) via DataForSEO.
  const metrics = await dfsKeywordMetrics(keywords.map(k => k.phrase))
  for (const k of keywords) {
    const m = metrics.get(k.phrase.toLowerCase())
    if (m) {
      await supabase.from('keyword_metrics').upsert({
        keyword_id: k.id, search_volume: m.search_volume, difficulty: m.difficulty,
        cpc: m.cpc, competition: m.competition, trend: m.trend, updated_at: new Date().toISOString(),
      })
    }
  }

  // 2) Rank tracking per (brand, keyword) via SerpAPI + denormalized metrics.
  let rankCount = 0
  for (const b of brands) {
    for (const k of keywords) {
      const { position, url } = await serpRank(k.phrase, b.domain!)
      const m = metrics.get(k.phrase.toLowerCase())
      await supabase.from('seo_results').insert({
        keyword_id: k.id, brand_id: b.id, position, url,
        search_volume: m?.search_volume ?? null, difficulty: m?.difficulty ?? null, cpc: m?.cpc ?? null,
      })
      rankCount++
    }
  }

  // 3) Domain authority + backlinks (once per brand) via DataForSEO.
  let domainCount = 0
  if (dfsAuth()) {
    for (const b of brands) {
      const [overview, summary, links] = await Promise.all([
        dfsDomainOverview(b.domain!),
        dfsBacklinkSummary(b.domain!),
        dfsBacklinks(b.domain!),
      ])
      await supabase.from('domain_metrics').upsert({
        brand_id: b.id, domain: rootDomain(b.domain!),
        domain_rating: summary.domain_rating, organic_traffic: overview.organic_traffic,
        organic_keywords: overview.organic_keywords, referring_domains: summary.referring_domains,
        backlinks_total: summary.backlinks_total, updated_at: new Date().toISOString(),
      })
      if (links.length) {
        await supabase.from('backlinks').delete().eq('brand_id', b.id)
        await supabase.from('backlinks').insert(links.map(l => ({ ...l, brand_id: b.id })))
      }
      domainCount++
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    ranks: rankCount,
    keyword_metrics: metrics.size,
    domains: domainCount,
    providers: { serpapi: !!SERP_API_KEY, dataforseo: !!dfsAuth() },
  }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
