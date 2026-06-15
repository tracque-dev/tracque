// TRQ-12 review-fix verification (migration 026).
// Proves an authenticated NON-owner cannot squat another tenant's client_id
// on client_reports / brands, and that legitimate owner writes still succeed.
// Uses two REAL auth users (RLS active), not service role.
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SB_URL!
const SR = process.env.SB_SR!
const ANON = process.env.SB_ANON!
const admin = createClient(URL, SR, { auth: { persistSession: false } })

const ts = Date.now()
const mk = (p: string) => ({ email: `e2e-trq12-${p}-${ts}@example.com`, password: `Pw!${ts}${p}aZ` })
const A = mk('a'), B = mk('b')

let failed = false
const ok = (c: boolean, label: string) => c ? console.log(`✓ ${label}`) : (console.error(`❌ ${label}`), failed = true)
const tok = (p: string) => p + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('')

const ids: { aUser?: string; bUser?: string } = {}
try {
  // Service role: create both users (email pre-confirmed so they can sign in).
  const ua = await admin.auth.admin.createUser({ email: A.email, password: A.password, email_confirm: true })
  const ub = await admin.auth.admin.createUser({ email: B.email, password: B.password, email_confirm: true })
  ids.aUser = ua.data.user!.id; ids.bUser = ub.data.user!.id
  // Victim B owns a client (seed via service role).
  const { data: bClient } = await admin.from('clients').insert({ user_id: ids.bUser, name: 'Victim CU', color: '#111' }).select().single()

  // Sign in as attacker A (RLS now applies to A's calls).
  const aCli = createClient(URL, ANON, { auth: { persistSession: false } })
  const { error: signErr } = await aCli.auth.signInWithPassword({ email: A.email, password: A.password })
  ok(!signErr, `attacker A signed in (${signErr?.message ?? 'ok'})`)

  // A creates A's OWN client (legitimate).
  const { data: aClient, error: aClientErr } = await aCli.from('clients').insert({ user_id: ids.aUser, name: 'Attacker CU', color: '#222' }).select().single()
  ok(!aClientErr && !!aClient, `A can create own client (${aClientErr?.message ?? 'ok'})`)

  console.log('\n— ATTACK: squat B\'s client_id on client_reports —')
  const { error: squatErr } = await aCli.from('client_reports').insert({ client_id: bClient!.id, user_id: ids.aUser, token: tok('x'), enabled: true })
  ok(!!squatErr, `squat REJECTED by RLS (${squatErr ? squatErr.message : 'NO ERROR — LEAK!'})`)

  console.log('\n— ATTACK: insert brand carrying B\'s client_id —')
  const { error: brandSquatErr } = await aCli.from('brands').insert({ user_id: ids.aUser, name: 'x', type: 'own', client_id: bClient!.id })
  ok(!!brandSquatErr, `brand-squat REJECTED by RLS (${brandSquatErr ? brandSquatErr.message : 'NO ERROR — LEAK!'})`)

  console.log('\n— LEGIT: owner writes still work —')
  const { error: ownLinkErr } = await aCli.from('client_reports').insert({ client_id: aClient!.id, user_id: ids.aUser, token: tok('y'), enabled: true })
  ok(!ownLinkErr, `A can create share link for OWN client (${ownLinkErr?.message ?? 'ok'})`)
  const { error: ownBrandErr } = await aCli.from('brands').insert({ user_id: ids.aUser, name: 'own brand', type: 'own', client_id: aClient!.id })
  ok(!ownBrandErr, `A can create brand for OWN client (${ownBrandErr?.message ?? 'ok'})`)
  const { error: nullBrandErr } = await aCli.from('brands').insert({ user_id: ids.aUser, name: 'unassigned', type: 'own', client_id: null })
  ok(!nullBrandErr, `A can create unassigned brand (client_id null) (${nullBrandErr?.message ?? 'ok'})`)

  console.log('\n— Victim B can still create their own link (no squat blocked them) —')
  const bCli = createClient(URL, ANON, { auth: { persistSession: false } })
  await bCli.auth.signInWithPassword({ email: B.email, password: B.password })
  const { error: bLinkErr } = await bCli.from('client_reports').insert({ client_id: bClient!.id, user_id: ids.bUser, token: tok('z'), enabled: true })
  ok(!bLinkErr, `B can create share link for B's own client (${bLinkErr?.message ?? 'ok'})`)
} catch (e) {
  console.error('threw:', e); failed = true
} finally {
  console.log('\n— cleanup —')
  for (const u of [ids.aUser, ids.bUser].filter(Boolean) as string[]) {
    await admin.from('client_reports').delete().eq('user_id', u)
    await admin.from('brands').delete().eq('user_id', u)
    await admin.from('clients').delete().eq('user_id', u)
    await admin.auth.admin.deleteUser(u)
  }
  console.log('cleaned up users + rows')
}
console.log(failed ? '\n=== RLS E2E FAILED ===' : '\n=== RLS E2E PASSED ===')
process.exit(failed ? 1 : 0)
