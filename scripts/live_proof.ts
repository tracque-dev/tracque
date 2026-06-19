// LIVE proof: does the product actually work? Seed a REAL brand, run the REAL
// scan function (live OpenAI web-search + SerpAPI), print raw output, clean up.
import { createClient } from '@supabase/supabase-js'
const URL = process.env.SB_URL!, SR = process.env.SB_SR!
const sb = createClient(URL, SR, { auth: { persistSession: false } })
const uid = 'live-proof-' + Date.now()

const brandName = 'Bellco Credit Union'   // real Denver, CO credit union
const phrase = 'best credit union in Denver'

let brandId = '', kwId = ''
try {
  const { data: brand } = await sb.from('brands').insert({ user_id: uid, name: brandName, domain: 'bellco.org', type: 'own' }).select().single()
  const { data: kw } = await sb.from('keywords').insert({ user_id: uid, phrase }).select().single()
  brandId = brand!.id; kwId = kw!.id
  console.log(`Seeded "${brandName}" + keyword "${phrase}". Running LIVE scan…\n`)

  const t0 = Date.now()
  const { data: resp, error } = await sb.functions.invoke('run-scan', { body: { user_id: uid, runs_per_keyword: 1 } })
  const secs = ((Date.now() - t0) / 1000).toFixed(1)
  if (error) { console.error('invoke error:', error); }
  console.log(`scan returned in ${secs}s:`, JSON.stringify(resp), '\n')

  const { data: results } = await sb.from('scan_results')
    .select('model, mentioned, position, runs_total, runs_mentioned, confidence_pct, sentiment, web_grounded, excerpt, citation_urls')
    .eq('brand_id', brandId)
  console.log('━━━ REAL scan_results (live from ChatGPT) ━━━')
  for (const r of results ?? []) {
    console.log(`  engine=${r.model}  mentioned=${r.mentioned}  pos=${r.position ?? '-'}  ${r.runs_mentioned}/${r.runs_total} runs  conf=${r.confidence_pct}%  sentiment=${r.sentiment ?? '-'}  web=${r.web_grounded}`)
    if (r.excerpt) console.log(`    excerpt: "${String(r.excerpt).slice(0, 260)}"`)
    if (r.citation_urls?.length) console.log(`    citations: ${r.citation_urls.slice(0,5).join(', ')}`)
  }
  if (!results?.length) console.log('  (no rows — scan produced nothing)')

  const { data: ov } = await sb.from('ai_overviews').select('snippet, brands_mentioned, cited_urls').eq('keyword_id', kwId)
  if (ov?.length) {
    console.log('\n━━━ Google AI Overview (live via SerpAPI) ━━━')
    console.log(`  brand mentioned in overview: ${JSON.stringify(ov[0].brands_mentioned)}`)
    console.log(`  snippet: "${String(ov[0].snippet).slice(0,200)}"`)
    console.log(`  cited: ${(ov[0].cited_urls ?? []).slice(0,6).join(', ')}`)
  } else {
    console.log('\n(no Google AI Overview returned for this query)')
  }
} catch (e) {
  console.error('threw:', e)
} finally {
  await sb.from('scan_results').delete().eq('brand_id', brandId)
  await sb.from('citation_sources').delete().eq('brand_id', brandId)
  await sb.from('ai_overviews').delete().eq('keyword_id', kwId)
  await sb.from('keywords').delete().eq('id', kwId)
  await sb.from('brands').delete().eq('id', brandId)
  console.log('\n(cleaned up test data)')
}
