// Tracque — Pull individual Google reviews (DataForSEO Business Data)
// Reviews are task-based: post a task, poll until ready, store the items,
// then compute the owner response rate (a key AI-recommendation signal).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const DFS_LOGIN = Deno.env.get('DATAFORSEO_LOGIN')
const DFS_PASSWORD = Deno.env.get('DATAFORSEO_PASSWORD')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
function auth(): string | null { return DFS_LOGIN && DFS_PASSWORD ? 'Basic ' + btoa(`${DFS_LOGIN}:${DFS_PASSWORD}`) : null }
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id) return new Response(JSON.stringify({ error: 'user_id + brand_id required' }), { status: 400, headers: cors })
  if (!auth()) return new Response(JSON.stringify({ error: 'DataForSEO not configured' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  // Need the place_id from a prior reputation scan.
  const { data: profile } = await supabase.from('review_profiles').select('place_id, reviews_count').eq('brand_id', brand_id).eq('platform', 'google').single()
  if (!profile?.place_id) return new Response(JSON.stringify({ error: 'run a reputation scan first (no place_id)' }), { status: 400, headers: cors })

  // 1) Post the reviews task.
  const post = await fetch('https://api.dataforseo.com/v3/business_data/google/reviews/task_post', {
    method: 'POST', headers: { Authorization: auth()!, 'Content-Type': 'application/json' },
    body: JSON.stringify([{ place_id: profile.place_id, depth: 30, sort_by: 'newest' }]),
  }).then(r => r.json()).catch(() => null)
  const taskId = post?.tasks?.[0]?.id
  if (!taskId) return new Response(JSON.stringify({ error: 'could not queue reviews task' }), { status: 502, headers: cors })

  // 2) Poll task_get until ready (reviews usually land within ~30s).
  let items: any[] | null = null
  for (let i = 0; i < 10; i++) {
    await sleep(5000)
    const got = await fetch(`https://api.dataforseo.com/v3/business_data/google/reviews/task_get/advanced/${taskId}`, {
      headers: { Authorization: auth()! },
    }).then(r => r.json()).catch(() => null)
    const t = got?.tasks?.[0]
    if (t?.status_code === 20000 && t?.result?.[0]?.items) { items = t.result[0].items; break }
  }
  if (!items) return new Response(JSON.stringify({ ok: false, pending: true, note: 'reviews still processing — try again shortly' }), { headers: cors })

  // 3) Store reviews + compute response rate.
  const rows = items.slice(0, 50).map((r: any) => ({
    brand_id, platform: 'google',
    author: r.profile_name ?? null,
    rating: r.rating?.value ?? null,
    text: (r.review_text ?? '').slice(0, 2000) || null,
    owner_answered: !!(r.owner_answer || r.responses?.length),
    posted_at: r.timestamp ? String(r.timestamp).slice(0, 10) : null,
  }))
  await supabase.from('reviews').delete().eq('brand_id', brand_id).eq('platform', 'google')
  if (rows.length) await supabase.from('reviews').insert(rows)

  const answered = rows.filter(r => r.owner_answered).length
  const responseRate = rows.length ? +(answered / rows.length).toFixed(2) : null
  await supabase.from('review_profiles').update({ response_rate: responseRate, updated_at: new Date().toISOString() })
    .eq('brand_id', brand_id).eq('platform', 'google')

  return new Response(JSON.stringify({ ok: true, reviews: rows.length, response_rate: responseRate }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
