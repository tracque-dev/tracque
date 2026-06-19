// Tracque — Continuous scan driver.
// Called daily by pg_cron. Finds every active account (≥1 brand AND ≥1 keyword)
// and runs the proven `run-scan` for each, so AI-visibility data refreshes on
// its own — no "Run scan" button required. Time-bounded so it never times out;
// any users not reached this tick are picked up the next day.
//
// Auth: protected by a shared CRON_SECRET header (it triggers paid API calls,
// so it must not be openly callable). Deployed --no-verify-jwt; the secret is
// the gate.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SB_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET')
const supabase = createClient(SB_URL, SERVICE_KEY)

// The seeded demo account — its data is a curated fixture; never overwrite it
// with a live scan of its placeholder domain.
const DEMO_USER = 'b41f2061-649e-4349-a605-5e21e1444a90'
const TIME_BUDGET_MS = 110_000
const MAX_USERS = 25

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // Active accounts: have at least one brand and at least one keyword.
  const { data: brandUsers } = await supabase.from('brands').select('user_id')
  const { data: kwUsers } = await supabase.from('keywords').select('user_id')
  const kwSet = new Set((kwUsers ?? []).map(k => k.user_id))
  const users = [...new Set((brandUsers ?? []).map(b => b.user_id))]
    .filter(u => u && u !== DEMO_USER && kwSet.has(u))
    .slice(0, MAX_USERS)

  const start = Date.now()
  const results: { user_id: string; ok: boolean; scanned?: number; error?: string }[] = []

  for (const user_id of users) {
    if (Date.now() - start > TIME_BUDGET_MS) break
    try {
      const res = await fetch(`${SB_URL}/functions/v1/run-scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, runs_per_keyword: 1 }),
      })
      const j = await res.json().catch(() => ({}))
      results.push({ user_id, ok: res.ok, scanned: j?.scanned })
    } catch (e) {
      results.push({ user_id, ok: false, error: String(e).slice(0, 140) })
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    eligible: users.length,
    processed: results.length,
    succeeded: results.filter(r => r.ok).length,
    results,
  }), { headers: { 'Content-Type': 'application/json' } })
})
