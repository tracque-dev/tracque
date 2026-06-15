// TRQ-12 live e2e — white-label report + cross-tenant isolation.
// Seeds two clients (A, B) with distinguishable data, then verifies that
// each share token returns ONLY its own client's data, and that bogus /
// disabled tokens are denied. Cleans up everything on exit.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SB_URL!
const SR = process.env.SB_SR!
const FN = `${URL}/functions/v1/shared-report`
const sb = createClient(URL, SR, { auth: { persistSession: false } })

const uid = `e2e-trq12-${Date.now()}`
const tok = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')
const tokenA = tok('a')
const tokenB = tok('b')

const fail = (m: string) => { console.error('❌ ' + m); failed = true }
let failed = false
const eq = (got: unknown, want: unknown, label: string) =>
  got === want ? console.log(`✓ ${label} = ${got}`) : fail(`${label}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

async function call(token: string) {
  const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
  return { status: r.status, body: await r.json().catch(() => null) as any }
}

async function seedClient(name: string, color: string, domain: string, token: string, mentionA: boolean) {
  const { data: c, error: ce } = await sb.from('clients').insert({ user_id: uid, name, color, domain }).select().single()
  if (ce) throw ce
  const cid = c.id
  const { data: brand, error: be } = await sb.from('brands').insert({ user_id: uid, name, type: 'own', domain, client_id: cid }).select().single()
  if (be) throw be
  const { data: kw } = await sb.from('keywords').insert({ user_id: uid, phrase: `${name} kw` }).select().single()
  // AI visibility: A → 70% (9+5 of 20), B → 10% (1 of 10)
  const scans = mentionA
    ? [{ model: 'chatgpt', runs_total: 10, runs_mentioned: 9, mentioned: true }, { model: 'claude', runs_total: 10, runs_mentioned: 5, mentioned: true }]
    : [{ model: 'chatgpt', runs_total: 10, runs_mentioned: 1, mentioned: true }]
  await sb.from('scan_results').insert(scans.map(s => ({ keyword_id: kw!.id, brand_id: brand.id, ...s, scanned_at: new Date().toISOString() })))
  // Reputation: A → 4.9/1234, B → 3.1/50
  await sb.from('review_profiles').insert({ brand_id: brand.id, platform: 'google', rating: mentionA ? 4.9 : 3.1, reviews_count: mentionA ? 1234 : 50, response_rate: 0.8 })
  // Attribution: A → 5 AI visitors + $5000, B → 2 AI visitors + $200
  const n = mentionA ? 5 : 2
  await sb.from('attribution_visits').insert(Array.from({ length: n }, (_, i) => ({ user_id: uid, client_id: cid, visitor_id: `${token}-v${i}`, source: 'chatgpt', is_ai: true })))
  await sb.from('attribution_conversions').insert({ user_id: uid, client_id: cid, visitor_id: `${token}-v0`, source: 'chatgpt', is_ai: true, value: mentionA ? 5000 : 200 })
  // Share token
  await sb.from('client_reports').insert({ client_id: cid, user_id: uid, token, enabled: true })
  return { cid, brandId: brand.id, keywordId: kw!.id }
}

async function cleanup(ids: { cid: string; brandId: string; keywordId: string }[]) {
  for (const x of ids) {
    await sb.from('scan_results').delete().eq('brand_id', x.brandId)
    await sb.from('review_profiles').delete().eq('brand_id', x.brandId)
    await sb.from('keywords').delete().eq('id', x.keywordId)
    await sb.from('brands').delete().eq('id', x.brandId)
  }
  await sb.from('attribution_visits').delete().eq('user_id', uid)
  await sb.from('attribution_conversions').delete().eq('user_id', uid)
  await sb.from('client_reports').delete().eq('user_id', uid)
  await sb.from('clients').delete().eq('user_id', uid)
}

const seeded: { cid: string; brandId: string; keywordId: string }[] = []
try {
  console.log('— seeding —')
  seeded.push(await seedClient('Acme Credit Union', '#E11D48', 'acme.test', tokenA, true))
  seeded.push(await seedClient('Beta Bank', '#0EA5E9', 'beta.test', tokenB, false))

  console.log('\n— token A (Acme) —')
  const a = await call(tokenA)
  eq(a.status, 200, 'A status')
  eq(a.body?.brand?.name, 'Acme Credit Union', 'A brand.name')
  eq(a.body?.brand?.color, '#E11D48', 'A brand.color (branding)')
  eq(a.body?.ai?.mention_rate, 70, 'A ai.mention_rate')
  eq(a.body?.reputation?.rating, 4.9, 'A reputation.rating')
  eq(a.body?.attribution?.visitors, 5, 'A attribution.visitors')
  eq(a.body?.attribution?.revenue, 5000, 'A attribution.revenue')
  eq(a.body?.attribution?.ai_share, 100, 'A attribution.ai_share')
  // ISOLATION: A must NOT carry any of B's values
  if (JSON.stringify(a.body).includes('Beta Bank')) fail('LEAK: A report contains "Beta Bank"')
  else console.log('✓ A contains no Beta Bank data (isolation)')

  console.log('\n— token B (Beta) —')
  const b = await call(tokenB)
  eq(b.body?.brand?.name, 'Beta Bank', 'B brand.name')
  eq(b.body?.ai?.mention_rate, 10, 'B ai.mention_rate')
  eq(b.body?.reputation?.rating, 3.1, 'B reputation.rating')
  eq(b.body?.attribution?.visitors, 2, 'B attribution.visitors')
  if (JSON.stringify(b.body).includes('Acme')) fail('LEAK: B report contains "Acme"')
  else console.log('✓ B contains no Acme data (isolation)')

  console.log('\n— invalid / disabled tokens —')
  eq((await call('totally-bogus-token-xyz')).status, 404, 'bogus token → 404')
  eq((await call('short')).status, 404, 'short token → 404')
  await sb.from('client_reports').update({ enabled: false }).eq('token', tokenA)
  eq((await call(tokenA)).status, 404, 'disabled token A → 404')
} catch (e) {
  fail('threw: ' + String(e))
} finally {
  console.log('\n— cleanup —')
  await cleanup(seeded)
  const { count } = await sb.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', uid)
  console.log(`residual clients for ${uid}: ${count ?? 0}`)
}
console.log(failed ? '\n=== E2E FAILED ===' : '\n=== E2E PASSED ===')
process.exit(failed ? 1 : 0)
