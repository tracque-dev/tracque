// Tracque — AI Visibility Scan Engine
// POST /functions/v1/run-scan
// Body: { user_id, brand_ids?, keyword_ids? }
// Runs each keyword against each AI model, parses mention + sentiment, stores results.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// ── Types ──────────────────────────────────────────────────

type AIModel = 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'grok'

interface ParsedMention {
  mentioned: boolean
  sentiment: 'positive' | 'neutral' | 'negative' | null
  position: number | null
  excerpt: string | null
  sources: string[]
}

// ── Prompt builder ─────────────────────────────────────────

function buildPrompt(keyword: string): string {
  return `${keyword}

Please provide a comprehensive answer. List specific tools, products, or companies by name where relevant. Be objective and mention multiple options.`
}

// ── Response parser ────────────────────────────────────────
// Extracts brand mention, position, sentiment, excerpt, and cited domains.

function parseResponse(response: string, brandName: string): ParsedMention {
  const lower = response.toLowerCase()
  const brandLower = brandName.toLowerCase()
  const mentioned = lower.includes(brandLower)

  if (!mentioned) {
    return { mentioned: false, sentiment: null, position: null, excerpt: null, sources: [] }
  }

  // Position: find which mention-number this brand is (1 = first brand named)
  const brandMatches = Array.from(lower.matchAll(new RegExp(brandLower, 'g')))
  const firstIdx = brandMatches[0]?.index ?? 0

  // Crude position: count how many other brand-like capitalized words appear before it
  const textBefore = response.slice(0, firstIdx)
  const properNouns = textBefore.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) ?? []
  const position = properNouns.length + 1

  // Excerpt: sentence containing the brand mention
  const sentences = response.split(/(?<=[.!?])\s+/)
  const mentionSentence = sentences.find(s => s.toLowerCase().includes(brandLower)) ?? ''
  const excerpt = mentionSentence.slice(0, 300)

  // Sentiment: keyword analysis on surrounding context
  const window = response.slice(Math.max(0, firstIdx - 200), firstIdx + 400).toLowerCase()
  const positiveWords = ['leading', 'best', 'top', 'excellent', 'popular', 'recommended', 'powerful', 'great', 'strong', 'trusted', 'widely used', 'favorite', 'robust']
  const negativeWords = ['poor', 'bad', 'expensive', 'limited', 'worst', 'avoid', 'problematic', 'slow', 'unreliable', 'disappointing', 'overpriced', 'clunky']
  const posScore = positiveWords.filter(w => window.includes(w)).length
  const negScore = negativeWords.filter(w => window.includes(w)).length
  const sentiment = posScore > negScore ? 'positive' : negScore > posScore ? 'negative' : 'neutral'

  // Sources: extract domains from markdown links or plain URLs
  const urlMatches = response.matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)
  const sources = [...new Set([...urlMatches].map(m => m[1].replace(/^www\./, '')))]

  return { mentioned, sentiment, position, excerpt, sources }
}

// ── Model callers ──────────────────────────────────────────

async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callPerplexity(prompt: string): Promise<string> {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('PERPLEXITY_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
      }),
    }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}

async function callGrok(prompt: string): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('XAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

const MODEL_CALLERS: Record<AIModel, (p: string) => Promise<string>> = {
  chatgpt: callOpenAI,
  perplexity: callPerplexity,
  gemini: callGemini,
  claude: callClaude,
  grok: callGrok,
}

function enabledModels(): AIModel[] {
  const all: AIModel[] = ['chatgpt', 'perplexity', 'gemini', 'claude', 'grok']
  return all.filter(m => {
    const keyMap: Record<AIModel, string> = {
      chatgpt: 'OPENAI_API_KEY',
      perplexity: 'PERPLEXITY_API_KEY',
      gemini: 'GEMINI_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      grok: 'XAI_API_KEY',
    }
    return !!Deno.env.get(keyMap[m])
  })
}

// ── Main handler ───────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { user_id, brand_ids, keyword_ids } = await req.json()

  if (!user_id) return new Response('user_id required', { status: 400 })

  // Load brands
  let brandsQ = supabase.from('brands').select('*').eq('user_id', user_id)
  if (brand_ids?.length) brandsQ = brandsQ.in('id', brand_ids)
  const { data: brands, error: brandsErr } = await brandsQ
  if (brandsErr || !brands?.length) return new Response(JSON.stringify({ error: 'No brands found' }), { status: 400 })

  // Load keywords
  let kwQ = supabase.from('keywords').select('*').eq('user_id', user_id)
  if (keyword_ids?.length) kwQ = kwQ.in('id', keyword_ids)
  const { data: keywords, error: kwErr } = await kwQ
  if (kwErr || !keywords?.length) return new Response(JSON.stringify({ error: 'No keywords found' }), { status: 400 })

  const models = enabledModels()
  const results: object[] = []
  let scanned = 0
  let errors = 0

  // For each keyword × model — call the AI once, parse for all brands
  for (const keyword of keywords) {
    const prompt = buildPrompt(keyword.phrase)

    for (const model of models) {
      let rawResponse = ''
      try {
        rawResponse = await MODEL_CALLERS[model](prompt)
      } catch (e) {
        console.error(`${model} failed for "${keyword.phrase}":`, e)
        errors++
        continue
      }

      // Parse mention for each brand from the same response
      const rows = brands.map(brand => {
        const parsed = parseResponse(rawResponse, brand.name)
        return {
          keyword_id: keyword.id,
          brand_id: brand.id,
          model,
          mentioned: parsed.mentioned,
          sentiment: parsed.sentiment,
          position: parsed.position,
          excerpt: parsed.excerpt,
          sources: parsed.sources,
          raw_response: rawResponse,
        }
      })

      const { error: insertErr } = await supabase.from('scan_results').insert(rows)
      if (insertErr) {
        console.error('Insert error:', insertErr)
        errors++
      } else {
        scanned += rows.length
        results.push(...rows.map(r => ({ ...r, raw_response: undefined }))) // omit raw from response
      }
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    scanned,
    errors,
    models_used: models,
    keywords_scanned: keywords.length,
    brands_tracked: brands.length,
  }), { headers: { 'Content-Type': 'application/json' } })
})
