// Tracque — Keyword Explorer (TRQ-34)
// Seed keyword → idea set with volume/difficulty/CPC/intent (DataForSEO Labs).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const DFS_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DFS_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }
function auth(): string | null { return DFS_LOGIN && DFS_PASSWORD ? 'Basic ' + btoa(`${DFS_LOGIN}:${DFS_PASSWORD}`) : null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, client_id, seed } = await req.json().catch(() => ({}))
  if (!user_id || !seed) return new Response(JSON.stringify({ error: 'user_id + seed required' }), { status: 400, headers: cors })
  if (!auth()) return new Response(JSON.stringify({ error: 'DataForSEO not configured' }), { status: 400, headers: cors })

  const res = await fetch('https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live', {
    method: 'POST', headers: { Authorization: auth()!, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ keywords: [String(seed).trim()], location_code: 2840, language_code: 'en', limit: 50 }]),
  })
  const items = (await res.json().catch(() => null))?.tasks?.[0]?.result?.[0]?.items ?? []
  if (!items.length) return new Response(JSON.stringify({ ok: true, ideas: 0, note: 'no ideas returned' }), { headers: cors })

  const cid = client_id && client_id !== 'all' ? client_id : null
  const rows = items.slice(0, 50).map((it: any) => ({
    user_id, client_id: cid, seed: String(seed).trim(),
    keyword: it.keyword ?? null,
    search_volume: it.keyword_info?.search_volume ?? null,
    difficulty: it.keyword_properties?.keyword_difficulty ?? null,
    cpc: it.keyword_info?.cpc ?? null,
    intent: it.search_intent_info?.main_intent ?? null,
  })).filter((r: any) => r.keyword)

  // Replace this workspace's idea set with the fresh search.
  let del = supabase.from('keyword_ideas').delete().eq('user_id', user_id)
  del = cid ? del.eq('client_id', cid) : del.is('client_id', null)
  await del
  if (rows.length) await supabase.from('keyword_ideas').insert(rows)

  return new Response(JSON.stringify({ ok: true, ideas: rows.length, seed }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
