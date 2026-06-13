// Tracque — Frontend Scrape Worker
// QStash calls this once per scan_task where source='frontend'.
//
// Flow:  claim_proxy → Browserbase session → scraper adapter
//        → parse → scan_results(source='frontend') → release_proxy
//        → scrape_sessions log + job progress + usage
//
// Runtime note: this drives playwright-core over CDP (no local Chromium).
// If the Supabase Edge sandbox can't load playwright-core, the same
// `_shared/scrapers` code lifts unchanged into a Node worker (Railway/Fly)
// behind the identical QStash endpoint — nothing else changes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { openBrowser } from '../_shared/scrapers/browser.ts'
import { getScraper } from '../_shared/scrapers/registry.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const FRONTEND_RUNS = Number(Deno.env.get('FRONTEND_RUNS') ?? '1') // real-UI capture; multi-run = later
const SCRAPE_TIMEOUT_MS = 75_000

// ── Answer parsing (brand mention / sentiment / position) ──
// Mirrors process-single-task so API and frontend results are comparable.
function parseResponse(text: string, brandName: string) {
  const lower = text.toLowerCase()
  const brandLower = brandName.toLowerCase()
  if (!lower.includes(brandLower)) return { mentioned: false, sentiment: null, position: null, excerpt: null }

  const firstIdx = lower.indexOf(brandLower)
  const position = [...new Set((text.slice(0, firstIdx).match(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*/g) ?? []))].length + 1
  const excerpt = (text.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes(brandLower)) ?? '').slice(0, 400)

  const window = text.slice(Math.max(0, firstIdx - 300), firstIdx + 500).toLowerCase()
  const pos = ['leading', 'best', 'top', 'excellent', 'popular', 'recommended', 'powerful', 'trusted', 'robust', 'widely used'].filter((w) => window.includes(w)).length
  const neg = ['poor', 'bad', 'expensive', 'limited', 'worst', 'avoid', 'slow', 'unreliable', 'disappointing', 'overpriced'].filter((w) => window.includes(w)).length
  const sentiment = pos > neg ? 'positive' : neg > pos ? 'negative' : 'neutral'

  return { mentioned: true, sentiment, position, excerpt }
}

async function fail(taskId: string, attempts: number, msg: string) {
  await supabase.from('scan_tasks')
    .update({ status: attempts >= 3 ? 'failed' : 'pending', error: msg, attempts })
    .eq('id', taskId)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  const { task_id } = await req.json()
  if (!task_id) return new Response(JSON.stringify({ error: 'task_id required' }), { status: 400 })

  // Load task + related keyword/brand.
  const { data: task, error: taskErr } = await supabase
    .from('scan_tasks')
    .select('id, job_id, model, attempts, geo:keyword(id), keyword:keywords(id, phrase, user_id), brand:brands(id, name)')
    .eq('id', task_id)
    .single()
  if (taskErr || !task) return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 })

  const keyword = task.keyword as any
  const brand = task.brand as any
  const attempts = (task.attempts ?? 0) + 1

  const scraper = getScraper(task.model)
  if (!scraper) {
    await supabase.from('scan_tasks').update({ status: 'failed', error: `No frontend adapter for ${task.model}` }).eq('id', task_id)
    return new Response(JSON.stringify({ skipped: true, reason: 'no-adapter' }))
  }

  await supabase.from('scan_tasks').update({ status: 'running', started_at: new Date().toISOString(), attempts }).eq('id', task_id)

  const geo = 'us'
  const startedAt = Date.now()

  // 1) Claim a proxy. Null = pool exhausted → requeue with backoff.
  const { data: proxyId } = await supabase.rpc('claim_proxy', { p_geo: geo })
  if (!proxyId) {
    await fail(task_id, attempts - 1, 'proxy-pool-exhausted') // keep pending, don't burn an attempt
    return new Response(JSON.stringify({ requeue: true, reason: 'no-proxy' }), { status: 429 })
  }

  // 2) Resolve the proxy URL (null → Browserbase-managed residential IP).
  const { data: proxyRow } = await supabase.from('scrape_proxies').select('proxy_url, geo').eq('id', proxyId).single()

  // 3) Open session row for observability.
  const { data: sess } = await supabase.from('scrape_sessions')
    .insert({ task_id, platform: task.model, provider: 'browserbase', proxy_id: proxyId, geo: proxyRow?.geo ?? geo, status: 'running' })
    .select('id').single()

  let browserSession: Awaited<ReturnType<typeof openBrowser>> | null = null
  try {
    browserSession = await openBrowser({ geo: proxyRow?.geo ?? geo, proxyUrl: proxyRow?.proxy_url ?? null, timeoutMs: SCRAPE_TIMEOUT_MS })
    await supabase.from('scrape_sessions').update({ provider_session: browserSession.providerSessionId }).eq('id', sess?.id)

    const prompt = `${keyword.phrase}`

    // Run the adapter (FRONTEND_RUNS times; new page per run = fresh chat).
    const runs: { text: string; citations: string[] }[] = []
    for (let i = 0; i < FRONTEND_RUNS; i++) {
      const page = i === 0 ? browserSession.page : await browserSession.browser.contexts()[0].newPage()
      const r = await scraper.run(page, { prompt, geo, timeoutMs: SCRAPE_TIMEOUT_MS })
      runs.push({ text: r.text, citations: r.citations })
    }

    // Aggregate (same shape as the API path).
    const parsed = runs.map((r) => parseResponse(r.text, brand.name))
    const mentionCount = parsed.filter((p) => p.mentioned).length
    const mentioned = mentionCount > FRONTEND_RUNS / 2
    const allSentiments = parsed.filter((p) => p.sentiment).map((p) => p.sentiment as string)
    const sentiment = allSentiments.length
      ? Object.entries(allSentiments.reduce((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), {} as Record<string, number>)).sort(([, a], [, b]) => b - a)[0][0]
      : null
    const positions = parsed.filter((p) => p.position).map((p) => p.position as number)
    const position = positions.length ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null
    const excerpt = parsed.find((p) => p.mentioned)?.excerpt ?? null
    const citations = [...new Set(runs.flatMap((r) => r.citations))]

    const { data: result } = await supabase.from('scan_results').insert({
      keyword_id: keyword.id,
      brand_id: brand.id,
      model: task.model,
      mentioned, sentiment, position, excerpt,
      sources: citations, citation_urls: citations,
      runs_total: FRONTEND_RUNS, runs_mentioned: mentionCount,
      confidence_pct: Math.round((mentionCount / FRONTEND_RUNS) * 100),
      all_sentiments: allSentiments,
      web_grounded: true,
      source: 'frontend',
      provider: 'browserbase',
      raw_response: runs[0]?.text ?? '',
    }).select('id').single()

    await supabase.from('scan_tasks').update({ status: 'completed', result_id: result?.id, proxy_id: proxyId, completed_at: new Date().toISOString() }).eq('id', task_id)
    await supabase.from('scrape_sessions').update({ status: 'completed', duration_ms: Date.now() - startedAt, completed_at: new Date().toISOString() }).eq('id', sess?.id)
    await supabase.rpc('release_proxy', { p_id: proxyId, p_success: true })
    await supabase.rpc('increment_job_done', { p_job_id: task.job_id })
    await supabase.rpc('log_model_usage', { p_user_id: keyword.user_id, p_model: `${task.model}_frontend`, p_calls: FRONTEND_RUNS, p_tokens_in: 0, p_tokens_out: 0 })

    return new Response(JSON.stringify({ ok: true, mentioned, source: 'frontend' }), { headers: { 'Content-Type': 'application/json' } })

  } catch (e: any) {
    const msg = String(e?.message ?? e)
    const block = msg.startsWith('blocked:') ? msg.split(':')[1] : null
    await supabase.from('scrape_sessions').update({
      status: block === 'captcha' ? 'captcha' : block === 'banned' ? 'banned' : 'failed',
      captcha_hit: block === 'captcha',
      error: msg,
      duration_ms: Date.now() - startedAt,
      completed_at: new Date().toISOString(),
    }).eq('id', sess?.id)
    // A block means the proxy is hot → longer cooldown.
    await supabase.rpc('release_proxy', { p_id: proxyId, p_success: false, p_cooldown_secs: block ? 600 : 90 })
    await fail(task_id, attempts, msg)
    return new Response(JSON.stringify({ error: msg, block }), { status: 500 })
  } finally {
    if (browserSession) await browserSession.close()
  }
})
