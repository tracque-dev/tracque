// Tracque — Competitor discovery + Keyword Gap (DataForSEO Labs)
//   competitors_domain  → who you really compete with in search
//   domain_intersection → keywords a competitor ranks for that you don't

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const DFS_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DFS_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')
const US = { location_code: 2840, language_code: 'en' }
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }

function auth(): string | null { return DFS_LOGIN && DFS_PASSWORD ? 'Basic ' + btoa(`${DFS_LOGIN}:${DFS_PASSWORD}`) : null }
function root(d: string): string { return d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase() }

// Generic mega-domains overlap with everyone — exclude so keyword gaps
// reflect real SEO competitors, not "you don't rank for 'amazon'".
const MEGA = new Set([
  'youtube.com', 'reddit.com', 'wikipedia.org', 'en.wikipedia.org', 'amazon.com', 'facebook.com',
  'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'pinterest.com', 'quora.com', 'medium.com',
  'google.com', 'apple.com', 'microsoft.com', 'tiktok.com', 'yelp.com', 'indeed.com', 'glassdoor.com',
  'forbes.com', 'github.com', 'nytimes.com', 'fandom.com',
])

async function labs(path: string, task: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://api.dataforseo.com/v3/dataforseo_labs/google/${path}/live`, {
    method: 'POST', headers: { Authorization: auth()!, 'Content-Type': 'application/json' }, body: JSON.stringify([task]),
  })
  if (!res.ok) return null
  return (await res.json())?.tasks?.[0]?.result ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id) return new Response(JSON.stringify({ error: 'user_id + brand_id required' }), { status: 400, headers: cors })
  if (!auth()) return new Response(JSON.stringify({ error: 'DataForSEO not configured' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, domain, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand?.domain) return new Response(JSON.stringify({ error: 'brand needs a domain' }), { status: 400, headers: cors })
  const target = root(brand.domain)

  // 1) Discover the real SEO competitors.
  const compResult = await labs('competitors_domain', { target, ...US, limit: 8 })
  const comps = (compResult?.[0]?.items ?? [])
    .filter((c: any) => { const r = root(c.domain || ''); return r && r !== target && !MEGA.has(r) })
    .map((c: any) => ({
      brand_id, domain: c.domain,
      common_keywords: c.full_domain_metrics?.organic?.count ?? c.metrics?.organic?.count ?? null,
      organic_traffic: Math.round(c.full_domain_metrics?.organic?.etv ?? c.metrics?.organic?.etv ?? 0) || null,
    }))
    .slice(0, 8)

  await supabase.from('seo_competitors').delete().eq('brand_id', brand_id)
  if (comps.length) await supabase.from('seo_competitors').insert(comps)

  // 2) Keyword gap vs the top 2 competitors (keywords they rank for, you don't).
  const gaps: any[] = []
  for (const c of comps.slice(0, 2)) {
    const inter = await labs('domain_intersection', {
      target1: root(c.domain), target2: target, intersections: false,
      item_types: ['organic'], ...US, limit: 30, order_by: ['keyword_data.keyword_info.search_volume,desc'],
    })
    for (const it of inter?.[0]?.items ?? []) {
      const kd = it.keyword_data ?? {}
      const ki = kd.keyword_info ?? {}
      gaps.push({
        brand_id, competitor_domain: root(c.domain),
        keyword: kd.keyword ?? it.keyword ?? null,
        search_volume: ki.search_volume ?? null,
        difficulty: kd.keyword_properties?.keyword_difficulty ?? null,
        cpc: ki.cpc ?? null,
        competitor_position: it.first_domain_serp_element?.rank_group ?? it.first_domain_serp_element?.rank_absolute ?? null,
        intent: kd.search_intent_info?.main_intent ?? null,
      })
    }
  }

  await supabase.from('keyword_gaps').delete().eq('brand_id', brand_id)
  if (gaps.length) await supabase.from('keyword_gaps').insert(gaps.slice(0, 100))

  return new Response(JSON.stringify({ ok: true, competitors: comps.length, gaps: gaps.length }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
