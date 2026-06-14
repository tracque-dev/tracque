// Tracque — Attribution ingest (public beacon endpoint)
// The tracking snippet POSTs visits + conversions here. We resolve the
// site_key → user_id/client_id, classify the source authoritatively
// (server-side, so it can't be spoofed by the client), and store it.
//
// Public + CORS-open by design (it's a web beacon), but every write is
// bound to a real site_key, and inserts run as service role.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Map a referrer host / utm to a canonical source + whether it's an AI engine.
const AI_HOSTS: Record<string, string> = {
  'chat.openai.com': 'chatgpt', 'chatgpt.com': 'chatgpt',
  'perplexity.ai': 'perplexity', 'www.perplexity.ai': 'perplexity',
  'gemini.google.com': 'gemini', 'bard.google.com': 'gemini',
  'claude.ai': 'claude', 'copilot.microsoft.com': 'copilot',
  'x.ai': 'grok', 'grok.com': 'grok',
}
const AI_UTM = new Set(['chatgpt', 'openai', 'perplexity', 'gemini', 'bard', 'claude', 'grok', 'copilot', 'ai'])

function classify(referrer = '', utm_source = '', utm_medium = '', gclid = '', fbclid = ''): { source: string; is_ai: boolean } {
  const us = utm_source.toLowerCase().trim()
  // Explicit UTM wins.
  if (us) {
    if (AI_UTM.has(us)) return { source: us === 'openai' ? 'chatgpt' : us === 'bard' ? 'gemini' : us, is_ai: true }
    if (us.includes('google') && (utm_medium === 'cpc' || gclid)) return { source: 'paid_google', is_ai: false }
    if (us.includes('facebook') || us.includes('meta') || us.includes('instagram')) return { source: utm_medium === 'cpc' || fbclid ? 'paid_meta' : 'referral', is_ai: false }
    return { source: us, is_ai: false }
  }
  if (gclid) return { source: 'paid_google', is_ai: false }
  if (fbclid) return { source: 'paid_meta', is_ai: false }

  let host = ''
  try { host = new URL(referrer).hostname.toLowerCase() } catch { /* no referrer */ }
  if (!host) return { source: 'direct', is_ai: false }
  if (AI_HOSTS[host]) return { source: AI_HOSTS[host], is_ai: true }
  if (host.endsWith('bing.com')) return { source: 'bing', is_ai: false }
  if (host.includes('google.')) return { source: 'google', is_ai: false }
  return { source: 'referral', is_ai: false }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return new Response('method', { status: 405, headers: cors })

  const body = await req.json().catch(() => null)
  if (!body?.site_key || !body?.visitor_id) {
    return new Response(JSON.stringify({ error: 'site_key + visitor_id required' }), { status: 400, headers: cors })
  }

  // Resolve the site → owner + client. Unknown key = silently 204 (don't leak which keys exist).
  const { data: site } = await supabase
    .from('tracking_sites').select('user_id, client_id').eq('site_key', body.site_key).single()
  if (!site) return new Response(null, { status: 204, headers: cors })

  const { source, is_ai } = classify(body.referrer, body.utm_source, body.utm_medium, body.gclid, body.fbclid)
  const scope = { user_id: site.user_id, client_id: site.client_id }

  try {
    if (body.type === 'conversion') {
      await supabase.from('attribution_conversions').insert({
        ...scope,
        visitor_id: body.visitor_id,
        source: body.source || source,            // snippet sends stored last-touch source if it has one
        is_ai: body.is_ai ?? is_ai,
        event_name: (body.event_name || 'conversion').slice(0, 64),
        value: typeof body.value === 'number' ? body.value : null,
        currency: (body.currency || 'USD').slice(0, 8),
      })
    } else {
      await supabase.from('attribution_visits').insert({
        ...scope,
        visitor_id: body.visitor_id,
        source, is_ai,
        medium: (body.utm_medium || '').slice(0, 64) || null,
        campaign: (body.utm_campaign || '').slice(0, 128) || null,
        referrer: (body.referrer || '').slice(0, 512) || null,
        landing_path: (body.landing_path || '').slice(0, 512) || null,
        country: req.headers.get('cf-ipcountry') || null,
      })
    }
    return new Response(JSON.stringify({ ok: true, source, is_ai }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})
