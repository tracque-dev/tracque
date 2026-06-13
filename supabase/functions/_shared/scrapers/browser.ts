// Tracque — Managed browser driver (Browserbase)
//
// We don't run Chromium ourselves. Browserbase gives us a stealth
// browser (fingerprinting + residential proxies + CAPTCHA handling)
// that we drive remotely over CDP with playwright-core.
//
// One Browserbase session == one (proxy, fingerprint) identity for the
// duration of a scrape. We create it, connect, hand the page to an
// adapter, then close it so the proxy/session is never reused dirty.

import { chromium, type Browser, type Page } from 'npm:playwright-core@1.48.0'

const BB_API = 'https://api.browserbase.com/v1'

export interface BrowserSession {
  browser: Browser
  page: Page
  providerSessionId: string
  close: () => Promise<void>
}

interface OpenOpts {
  geo?: string            // 'us', 'gb', ... → Browserbase proxy geo
  proxyUrl?: string | null // self-supplied proxy; null = let Browserbase manage
  timeoutMs?: number
}

/**
 * Create a Browserbase session and connect Playwright to it.
 * Throws if BROWSERBASE_API_KEY / PROJECT_ID are unset or the API errors.
 */
export async function openBrowser(opts: OpenOpts = {}): Promise<BrowserSession> {
  const apiKey = Deno.env.get('BROWSERBASE_API_KEY')
  const projectId = Deno.env.get('BROWSERBASE_PROJECT_ID')
  if (!apiKey || !projectId) {
    throw new Error('BROWSERBASE_API_KEY / BROWSERBASE_PROJECT_ID not set')
  }

  // Proxy config: either route through a self-supplied proxy, or let
  // Browserbase serve a geo-targeted residential IP.
  const proxies = opts.proxyUrl
    ? [{ type: 'external', server: opts.proxyUrl }]
    : [{ type: 'browserbase', geolocation: { country: (opts.geo ?? 'us').toUpperCase() } }]

  const res = await fetch(`${BB_API}/sessions`, {
    method: 'POST',
    headers: { 'X-BB-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      proxies,
      browserSettings: {
        // Realistic, stable fingerprint per session.
        fingerprint: { devices: ['desktop'], operatingSystems: ['macos', 'windows'] },
        solveCaptchas: true,
        viewport: { width: 1366, height: 900 },
      },
      // Hard cap so a hung scrape can't leak a paid session.
      timeout: Math.ceil((opts.timeoutMs ?? 60_000) / 1000) + 30,
    }),
  })

  if (!res.ok) {
    throw new Error(`Browserbase session create failed: ${res.status} ${await res.text()}`)
  }

  const session = await res.json() as { id: string; connectUrl: string }
  const browser = await chromium.connectOverCDP(session.connectUrl)

  const context = browser.contexts()[0] ?? (await browser.newContext())
  const page = context.pages()[0] ?? (await context.newPage())
  page.setDefaultTimeout(opts.timeoutMs ?? 60_000)

  return {
    browser,
    page,
    providerSessionId: session.id,
    close: async () => {
      try { await browser.close() } catch { /* best-effort */ }
      // Tell Browserbase to release immediately (don't wait for timeout).
      try {
        await fetch(`${BB_API}/sessions/${session.id}`, {
          method: 'POST',
          headers: { 'X-BB-API-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, status: 'REQUEST_RELEASE' }),
        })
      } catch { /* best-effort */ }
    },
  }
}

/** Detect the common soft-block / challenge states so we can quarantine. */
export async function detectBlock(page: Page): Promise<'captcha' | 'banned' | null> {
  const url = page.url()
  if (/\/(challenge|captcha)/i.test(url)) return 'captcha'
  const body = (await page.content()).toLowerCase()
  if (body.includes('verify you are human') || body.includes('cf-challenge')) return 'captcha'
  if (body.includes('access denied') || body.includes('unusual activity') || body.includes('rate limit')) return 'banned'
  return null
}

/** Human-ish jitter between actions to look less scripted. */
export function jitter(min = 400, max = 1400): Promise<void> {
  const ms = Math.floor(min + Math.random() * (max - min))
  return new Promise((r) => setTimeout(r, ms))
}
