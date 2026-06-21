// Tracque — AI GA4 Configuration generator
// Crawls a site, asks AI to identify the business + its real conversion
// actions, returns an optimal GA4 event plan, then deterministically
// renders an importable GTM container (incl. the tracque_source custom
// dimension, so AI-source attribution flows into the client's GA4).

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

// Condense a page to the signals the model needs (cheap + focused).
function condense(html: string): string {
  const pick = (re: RegExp, n: number) => [...html.matchAll(re)].slice(0, n).map(m => (m[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
  const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim()
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '').trim()
  const h = pick(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi, 12)
  const buttons = pick(/<button[^>]*>([\s\S]*?)<\/button>/gi, 20).concat(pick(/<a[^>]+class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, 20))
  const forms = [...html.matchAll(/<form[\s\S]*?<\/form>/gi)].slice(0, 6).map(m => (m[0].match(/(?:name|id|action)=["']([^"']+)["']/i)?.[1] || 'form'))
  const links = pick(/<a[^>]*>([\s\S]*?)<\/a>/gi, 40).filter(t => t.length < 40)
  const tel = /href=["']tel:/i.test(html)
  return JSON.stringify({ title, description: desc, headings: h, buttons: [...new Set(buttons)], forms, nav_links: [...new Set(links)].slice(0, 25), has_phone_link: tel }).slice(0, 6000)
}

const PLAN_PROMPT = (site: string) => `You are a senior GA4 / analytics implementation expert. Given this website's condensed content, identify the business type/industry and design an OPTIMAL GA4 measurement plan.

Rules:
- Use GA4's official recommended event names where they fit (generate_lead, contact, sign_up, login, purchase, begin_checkout, add_to_cart, schedule, submit_application, search, view_item). Only invent snake_case custom events when no recommended one fits.
- Tailor events to THIS business (e.g. a plumber: generate_lead, contact, click_to_call, request_quote; a credit union: submit_application, schedule, generate_lead; a SaaS: sign_up, start_trial, begin_checkout).
- Mark the 1-4 most important as key events (conversions).
- Every event MUST be tied to a concrete on-page trigger.

Return ONLY JSON (no prose):
{
  "business_type": "<short>",
  "events": [
    { "name": "<ga4_event>", "trigger": "<when it fires, e.g. 'Submit contact form' or 'Click Call Now button'>", "element": "<selector or text, e.g. form#contact or a[href^=tel:]>", "category": "conversion|engagement|navigation|attribution", "is_key_event": true|false }
  ],
  "notes": "<one line of advice>"
}

WEBSITE:
${site}`

async function aiPlan(site: string): Promise<any> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [{ role: 'user', content: PLAN_PROMPT(site) }],
    }),
  })
  const data = await res.json()
  return JSON.parse(data.choices?.[0]?.message?.content ?? '{}')
}

// Deterministically render a valid GTM container from the event plan.
function buildContainer(domain: string, ga4Id: string, events: any[]): object {
  let id = 100
  const tags: any[] = []
  const triggers: any[] = []

  // GA4 Configuration tag — fires on all pages, carries tracque_source as a custom dimension.
  const cfgId = ++id
  tags.push({
    accountId: '0', containerId: '0', tagId: String(cfgId), name: 'GA4 Configuration',
    type: 'gaawc', firingTriggerId: ['2147479553'],
    parameter: [
      { type: 'TEMPLATE', key: 'measurementId', value: ga4Id },
      { type: 'BOOLEAN', key: 'sendPageView', value: 'true' },
      { type: 'LIST', key: 'fieldsToSet', list: [
        { type: 'MAP', map: [{ type: 'TEMPLATE', key: 'fieldName', value: 'tracque_source' }, { type: 'TEMPLATE', key: 'value', value: '{{tracque_source}}' }] },
      ] },
    ],
  })

  events.forEach((ev) => {
    const tId = ++id
    const trigId = ++id
    const isForm = /form|submit/i.test(ev.trigger || '') || /form/i.test(ev.element || '')
    const isTel = /tel:|call/i.test(`${ev.trigger} ${ev.element}`)
    // Trigger: form submit, or click matching the element/CTA text.
    if (isForm) {
      triggers.push({ accountId: '0', containerId: '0', triggerId: String(trigId), name: `Submit – ${ev.name}`, type: 'FORM_SUBMISSION', filter: [] })
    } else {
      const clickText = (ev.element || ev.trigger || '').replace(/^.*?["']?([A-Za-z][\w\s]{2,30}).*$/, '$1').trim() || ev.name
      triggers.push({
        accountId: '0', containerId: '0', triggerId: String(trigId), name: `Click – ${ev.name}`, type: isTel ? 'LINK_CLICK' : 'CLICK',
        filter: [{ type: 'CONTAINS', parameter: [{ type: 'TEMPLATE', key: 'arg0', value: '{{Click Text}}' }, { type: 'TEMPLATE', key: 'arg1', value: clickText }] }],
        ...(isTel ? { waitForTags: [{ type: 'BOOLEAN', key: 'waitForTags', value: 'false' }] } : {}),
      })
    }
    tags.push({
      accountId: '0', containerId: '0', tagId: String(tId), name: `GA4 Event – ${ev.name}`,
      type: 'gaawe', firingTriggerId: [String(trigId)],
      parameter: [
        { type: 'TEMPLATE', key: 'eventName', value: ev.name },
        { type: 'TAG_REFERENCE', key: 'measurementId', value: 'GA4 Configuration' },
        { type: 'LIST', key: 'eventParameters', list: [
          { type: 'MAP', map: [{ type: 'TEMPLATE', key: 'name', value: 'tracque_source' }, { type: 'TEMPLATE', key: 'value', value: '{{tracque_source}}' }] },
        ] },
      ],
    })
  })

  // Variable: tracque_source from URL ?utm_source / referrer (set by our snippet's cookie too).
  const variables = [{
    accountId: '0', containerId: '0', variableId: '1', name: 'tracque_source',
    type: 'k', parameter: [{ type: 'TEMPLATE', key: 'name', value: '_tq_src' }, { type: 'INTEGER', key: 'decodeCookie', value: 'true' }],
  }]

  return {
    exportFormatVersion: 2,
    exportTime: '2026-01-01 00:00:00',
    containerVersion: {
      container: { name: `Tracque – ${domain}`, publicId: 'GTM-XXXXXXX', usageContext: ['WEB'] },
      tag: tags, trigger: triggers, variable: variables,
      builtInVariable: [
        { type: 'CLICK_TEXT', name: 'Click Text' },
        { type: 'CLICK_URL', name: 'Click URL' },
        { type: 'FORM_ID', name: 'Form ID' },
        { type: 'PAGE_URL', name: 'Page URL' },
      ],
    },
  }
}

function buildGuide(businessType: string, ga4Id: string, events: any[], notes: string): string {
  const keys = events.filter(e => e.is_key_event).map(e => e.name)
  return [
    `Detected business type: ${businessType}`,
    ``,
    `1. In Google Tag Manager → Admin → Import Container → upload the downloaded JSON → choose "Merge".`,
    `2. Set your GA4 Measurement ID${ga4Id.includes('X') ? ' (replace G-XXXXXXXXXX with your real ID)' : `: ${ga4Id}`} on the "GA4 Configuration" tag.`,
    `3. In GA4 → Admin → Events → mark these as KEY EVENTS (conversions): ${keys.join(', ') || 'your top events'}.`,
    `4. In GA4 → Admin → Custom definitions → create a custom dimension "tracque_source" (event-scoped) so AI/source shows in reports.`,
    `5. Keep the Tracque snippet installed — it sets the _tq_src cookie the container reads, so every GA4 conversion is tagged with its AI source.`,
    notes ? `\nTip: ${notes}` : ``,
  ].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { url, ga4_id } = await req.json().catch(() => ({}))
  if (!url) return new Response(JSON.stringify({ error: 'url required' }), { status: 400, headers: cors })
  if (!OPENAI_API_KEY) return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), { status: 400, headers: cors })

  const target = url.startsWith('http') ? url : `https://${url}`
  let domain = target
  try { domain = new URL(target).hostname.replace(/^www\./, '') } catch { /* */ }
  const ga4 = (ga4_id && ga4_id.trim()) || 'G-XXXXXXXXXX'

  try {
    const html = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 TracqueAudit/1.0' } }).then(r => r.text()).catch(() => '')
    const plan = await aiPlan(condense(html))
    const events = (plan.events ?? []).map((e: any) => ({
      name: e.name, trigger: e.trigger, element: e.element ?? '', category: e.category ?? 'engagement', is_key_event: !!e.is_key_event,
    }))
    if (!events.length) throw new Error('No events generated — site may be unreachable')

    return new Response(JSON.stringify({
      url: target,
      business_type: plan.business_type ?? '',
      events,
      gtm_container: buildContainer(domain, ga4, events),
      guide: buildGuide(plan.business_type ?? 'business', ga4, events, plan.notes ?? ''),
    }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: cors })
  }
})
