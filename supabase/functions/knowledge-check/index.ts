// Tracque — Knowledge Panel detection (TRQ-25)
// Does Google show a knowledge panel for the brand? (SerpAPI knowledge_graph)
// A strong AI-citation signal. Stored on domain_metrics.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const SERP = Deno.env.get('SERP_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

function rootDomain(d: string): string { return (d || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase() }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id) return new Response(JSON.stringify({ error: 'user_id + brand_id required' }), { status: 400, headers: cors })
  if (!SERP) return new Response(JSON.stringify({ error: 'SERP_API_KEY not set' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, name, domain, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  const params = new URLSearchParams({ engine: 'google', q: brand.name, api_key: SERP, gl: 'us', hl: 'en' })
  const data = await fetch(`https://serpapi.com/search?${params}`).then(r => r.json()).catch(() => null)
  const kg = data?.knowledge_graph
  const has = !!kg
  const type = kg?.type ?? (kg ? 'entity' : null)

  await supabase.from('domain_metrics').upsert({
    brand_id, domain: rootDomain(brand.domain ?? ''),
    has_knowledge_panel: has, knowledge_type: type, updated_at: new Date().toISOString(),
  })

  return new Response(JSON.stringify({ ok: true, has_knowledge_panel: has, knowledge_type: type, title: kg?.title ?? null }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
