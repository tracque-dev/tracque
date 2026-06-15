// Tracque — AI Rate-Accuracy Monitor (TRQ-70)
// For each ground-truth fact, ask the AI what the brand's value is
// (web-grounded), then judge whether the AI's answer matches the truth.
// Flags wrong rates/fees/hours before they cause reputational/regulatory harm.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const OPENAI = Deno.env.get('OPENAI_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }

async function ask(prompt: string): Promise<string> {
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

// Judge the AI answer against ground truth.
async function judge(answer: string, label: string, truth: string): Promise<{ status: string; ai_value: string | null }> {
  if (!answer) return { status: 'not_stated', ai_value: null }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini', temperature: 0, response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: `The correct value for "${label}" is "${truth}". Read the AI answer below. Did it state a value for this? What value? Does it match the correct one (treat equivalent formats as matching, e.g. 4.5% = 4.50%)?\n\nReturn ONLY JSON: {"ai_value": "<what the answer stated, or null>", "status": "accurate" | "wrong" | "not_stated"}\n\nAI ANSWER:\n${answer.slice(0, 3000)}` }],
      }),
    })
    const d = await res.json()
    const j = JSON.parse(d.choices?.[0]?.message?.content ?? '{}')
    const status = ['accurate', 'wrong', 'not_stated'].includes(j.status) ? j.status : 'not_stated'
    return { status, ai_value: j.ai_value ?? null }
  } catch { return { status: 'not_stated', ai_value: null } }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { user_id, brand_id } = await req.json().catch(() => ({}))
  if (!user_id || !brand_id) return new Response(JSON.stringify({ error: 'user_id + brand_id required' }), { status: 400, headers: cors })
  if (!OPENAI) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 400, headers: cors })

  const { data: brand } = await supabase.from('brands').select('id, name, user_id').eq('id', brand_id).eq('user_id', user_id).single()
  if (!brand) return new Response(JSON.stringify({ error: 'brand not found' }), { status: 404, headers: cors })

  const { data: facts } = await supabase.from('rate_facts').select('*').eq('brand_id', brand_id)
  if (!facts?.length) return new Response(JSON.stringify({ ok: true, note: 'add ground-truth facts first', checked: 0 }), { headers: cors })

  const checks: any[] = []
  for (const f of facts.slice(0, 20)) {
    const answer = await ask(`What is ${brand.name}'s ${f.label}? Give the current figure.`)
    const { status, ai_value } = await judge(answer, f.label, f.value)
    checks.push({ brand_id, fact_id: f.id, engine: 'chatgpt', ai_value, status, excerpt: answer.slice(0, 300) })
  }

  await supabase.from('rate_checks').insert(checks)
  const wrong = checks.filter(c => c.status === 'wrong').length
  return new Response(JSON.stringify({
    ok: true, checked: checks.length, wrong,
    accurate: checks.filter(c => c.status === 'accurate').length,
    not_stated: checks.filter(c => c.status === 'not_stated').length,
  }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
