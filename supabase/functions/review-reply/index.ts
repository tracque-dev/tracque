// Tracque — AI-drafted review reply
// Generates an on-brand owner response to a review. Replying lifts
// response rate, which AI models weigh when recommending businesses.

const OPENAI = Deno.env.get('OPENAI_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { review_text, rating, business_name } = await req.json().catch(() => ({}))
  if (!review_text) return new Response(JSON.stringify({ error: 'review_text required' }), { status: 400, headers: cors })
  if (!OPENAI) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 400, headers: cors })

  const tone = (rating ?? 5) >= 4
    ? 'Warmly thank them, reference a specific detail, and invite them back.'
    : 'Be empathetic and accountable, apologize sincerely, address the specific issue, and offer to make it right offline — never defensive.'

  const prompt = `Write a short (2-4 sentence) owner reply to this Google review for ${business_name || 'the business'}.
${tone} Sound human and specific, not templated. No emojis, no hashtags. Don't restate the star rating.

REVIEW (${rating ?? '?'}★): "${String(review_text).slice(0, 1500)}"

Reply:`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await res.json()
    const reply = (d.choices?.[0]?.message?.content ?? '').trim()
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: cors })
  }
})
