// Tracque — Reputation sync (DataForSEO Business Data)
// One business_listings/search call returns the brand's Google listing
// (rating, review count, aspect topics, claimed) AND the local competitive
// set. We store the profile + the Share-of-Local-Voice grid.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const DFS_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DFS_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }

function dfsAuth(): string | null {
  if (!DFS_LOGIN || !DFS_PASSWORD) return null
  return 'Basic ' + btoa(`${DFS_LOGIN}:${DFS_PASSWORD}`)
}

function norm(s: string): string { return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '') }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id, category, location } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id) return new Response(JSON.stringify({ error: 'user_id + brand_id required' }), { status: 400, headers: cors })
  if (!dfsAuth()) return new Response(JSON.stringify({ error: 'DataForSEO not configured' }), { status: 400, headers: cors })

  // Brand must belong to the user.
  const { data: brand } = await supabase.from('brands').select('id, name, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  const loc = location || '40.7128,-74.0060,15' // default NYC 15km if not provided
  const cats = category ? [category] : undefined

  const res = await fetch('https://api.dataforseo.com/v3/business_data/business_listings/search/live', {
    method: 'POST',
    headers: { Authorization: dfsAuth()!, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ categories: cats, title: cats ? undefined : brand.name, location_coordinate: loc, order_by: ['rating.value,desc'], limit: 20 }]),
  })
  const json = await res.json().catch(() => null)
  const items = json?.tasks?.[0]?.result?.[0]?.items ?? []
  if (!items.length) return new Response(JSON.stringify({ ok: true, note: 'no listings found — check category/location', competitors: 0 }), { headers: cors })

  const target = norm(brand.name)
  let self: any = null
  const competitors = items.map((b: any) => {
    const isSelf = !!target && norm(b.title || '').includes(target)
    if (isSelf && !self) self = b
    return {
      brand_id, name: b.title ?? null,
      rating: b.rating?.value ?? null,
      reviews_count: b.rating?.votes_count ?? null,
      is_claimed: b.is_claimed ?? null,
      is_self: isSelf,
    }
  })

  // Refresh the local grid snapshot.
  await supabase.from('local_competitors').delete().eq('brand_id', brand_id)
  await supabase.from('local_competitors').insert(competitors)

  // Store/refresh the brand's own Google rating profile (if found in the set).
  if (self) {
    const topics = (self.place_topics ? Object.entries(self.place_topics).map(([topic, count]) => ({ topic, count })) : [])
      .sort((a: any, b: any) => b.count - a.count).slice(0, 8)
    await supabase.from('review_profiles').upsert({
      brand_id, platform: 'google',
      rating: self.rating?.value ?? null,
      reviews_count: self.rating?.votes_count ?? null,
      place_id: self.place_id ?? null,
      topics, updated_at: new Date().toISOString(),
    })
  }

  return new Response(JSON.stringify({
    ok: true,
    competitors: competitors.length,
    self_found: !!self,
    rating: self?.rating?.value ?? null,
    reviews: self?.rating?.votes_count ?? null,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
