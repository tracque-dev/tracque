// Tracque — Geo-grid Share-of-AI-Voice (TRQ-23)
// Geocode a center, sample a 3x3 grid of nearby localities, ask ChatGPT
// "best [category] in [locality]" per cell, and record whether the brand
// is recommended. Cost guard: 9 cells max.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const OPENAI = Deno.env.get('OPENAI_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const UA = { 'User-Agent': 'TracqueGeoGrid/1.0 (https://tracque.com)' }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function geocode(q: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: UA })
    const j = await r.json()
    if (j?.[0]?.lat) return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) }
  } catch { /* */ }
  return null
}
async function reverse(lat: number, lng: number): Promise<string> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`, { headers: UA })
    const a = (await r.json())?.address ?? {}
    return a.neighbourhood || a.suburb || a.city_district || a.town || a.city || a.county || `${lat.toFixed(2)},${lng.toFixed(2)}`
  } catch { return `${lat.toFixed(2)},${lng.toFixed(2)}` }
}
async function askMentioned(category: string, locality: string, brand: string): Promise<{ mentioned: boolean; position: number | null }> {
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', tools: [{ type: 'web_search_preview' }], input: `Best ${category} in ${locality}? List a few specific names.` }),
    })
    const d = await res.json()
    let text = ''
    for (const b of d.output ?? []) for (const c of b.content ?? []) if (c.type === 'output_text') text += c.text
    const low = text.toLowerCase(), bl = brand.toLowerCase()
    const idx = low.indexOf(bl)
    if (idx < 0) return { mentioned: false, position: null }
    // heuristic position: distinct brand-like proper nouns before first mention + 1
    const before = text.slice(0, idx)
    const pos = [...new Set((before.match(/\b[A-Z][a-zA-Z&'-]+(?:\s[A-Z][a-zA-Z&'-]+){0,3}/g) ?? []))].length + 1
    return { mentioned: true, position: Math.min(pos, 20) }
  } catch { return { mentioned: false, position: null } }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id, category, location } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id || !category || !location) return new Response(JSON.stringify({ error: 'user_id, brand_id, category, location required' }), { status: 400, headers: cors })
  if (!OPENAI) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, name, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  const center = await geocode(location)
  if (!center) return new Response(JSON.stringify({ error: 'could not geocode location' }), { status: 400, headers: cors })

  // 3x3 grid (~±5km). Cost guard: exactly 9 cells.
  const step = 0.05
  const cells: { lat: number; lng: number }[] = []
  for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) cells.push({ lat: center.lat + dy * step, lng: center.lng + dx * step })

  // Reverse-geocode sequentially (Nominatim rate limit ~1/s), then run the
  // 9 web-grounded AI checks IN PARALLEL so the whole scan is ~15s, not ~60s.
  const grid = cells.slice(0, 9)
  const localities: string[] = []
  for (const c of grid) { localities.push(await reverse(c.lat, c.lng)); await sleep(1100) }
  const results = await Promise.all(grid.map((c, i) => askMentioned(category, localities[i], brand.name)))
  const rows = grid.map((c, i) => ({
    brand_id, label: localities[i], lat: c.lat, lng: c.lng,
    mentioned: results[i].mentioned, position: results[i].position,
  }))

  await supabase.from('saiv_grid').delete().eq('brand_id', brand_id)
  await supabase.from('saiv_grid').insert(rows)

  const hits = rows.filter(r => r.mentioned).length
  return new Response(JSON.stringify({ ok: true, cells: rows.length, mentioned: hits, coverage: Math.round((hits / rows.length) * 100) }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
