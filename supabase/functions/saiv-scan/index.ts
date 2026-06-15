// Tracque — Share-of-AI-Voice scan
// For each prompt: get a web-grounded ChatGPT answer, then a cheap
// structured extraction of which brands were recommended (and where the
// target brand ranks). Stores a grid the SAIV page renders.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const OPENAI = Deno.env.get('OPENAI_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }

// Web-grounded answer to a real buyer question.
async function answer(prompt: string): Promise<string> {
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', tools: [{ type: 'web_search_preview' }], input: prompt }),
    })
    const d = await res.json()
    let text = ''
    for (const b of d.output ?? []) for (const c of b.content ?? []) if (c.type === 'output_text') text += c.text
    return text
  } catch { return '' }
}

// Structured extraction: which brands were recommended, and where does ours rank?
async function extract(answerText: string, brand: string): Promise<{ mentioned: boolean; position: number | null; brands: string[] }> {
  if (!answerText) return { mentioned: false, position: null, brands: [] }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: `From this AI answer, list the specific brands/products/companies RECOMMENDED, in the order presented. Then say whether "${brand}" is among them and its 1-based rank.\n\nReturn ONLY JSON: {"brands": ["..."], "mentioned": true|false, "position": <int or null>}\n\nANSWER:\n${answerText.slice(0, 4000)}` }],
      }),
    })
    const d = await res.json()
    const j = JSON.parse(d.choices?.[0]?.message?.content ?? '{}')
    const brands: string[] = Array.isArray(j.brands) ? j.brands.map((b: any) => String(b)).slice(0, 12) : []
    return { mentioned: !!j.mentioned, position: typeof j.position === 'number' ? j.position : null, brands }
  } catch { return { mentioned: false, position: null, brands: [] } }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id, prompts } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id || !Array.isArray(prompts) || !prompts.length) {
    return new Response(JSON.stringify({ error: 'user_id, brand_id, prompts[] required' }), { status: 400, headers: cors })
  }
  if (!OPENAI) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, name, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  const list = prompts.slice(0, 12).map((p: any) => String(p).trim()).filter(Boolean)
  const rows: any[] = []
  for (const prompt of list) {
    const text = await answer(prompt)
    const ex = await extract(text, brand.name)
    const own = brand.name.toLowerCase()
    rows.push({
      brand_id, engine: 'chatgpt', prompt,
      mentioned: ex.mentioned || text.toLowerCase().includes(own),
      position: ex.position,
      competitors: ex.brands.filter(b => b.toLowerCase() !== own),
      excerpt: text.slice(0, 300),
    })
  }

  // Replace this brand's grid with the fresh scan.
  await supabase.from('saiv_results').delete().eq('brand_id', brand_id)
  if (rows.length) await supabase.from('saiv_results').insert(rows)

  const mentioned = rows.filter(r => r.mentioned).length
  return new Response(JSON.stringify({
    ok: true, prompts: rows.length, mentioned,
    saiv: rows.length ? Math.round((mentioned / rows.length) * 100) : 0,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
