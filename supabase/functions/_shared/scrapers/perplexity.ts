// Tracque — Perplexity (logged-out) scraper
//
// perplexity.ai answers without login. We submit the query, wait for the
// answer prose to settle, then extract the answer text + source links.

import type { Page } from 'npm:playwright-core@1.48.0'
import { type FrontendScraper, type ScrapeResult, type ScraperContext, hostname, uniq } from './types.ts'
import { detectBlock, jitter } from './browser.ts'

export const perplexityScraper: FrontendScraper = {
  model: 'perplexity',
  label: 'Perplexity (web)',
  requiresAuth: false,

  async run(page: Page, ctx: ScraperContext): Promise<ScrapeResult> {
    await page.goto('https://www.perplexity.ai/', { waitUntil: 'domcontentloaded', timeout: ctx.timeoutMs })
    await jitter()

    const blocked = await detectBlock(page)
    if (blocked) throw new Error(`blocked:${blocked}`)

    for (const sel of ['button:has-text("Accept")', 'button:has-text("Got it")', 'button[aria-label="Close"]']) {
      const el = page.locator(sel).first()
      if (await el.count().catch(() => 0)) { await el.click().catch(() => {}); await jitter(200, 500) }
    }

    const input = page.locator('textarea, div[contenteditable="true"]').first()
    await input.waitFor({ state: 'visible', timeout: ctx.timeoutMs })
    await input.click()
    await jitter()
    await input.fill(ctx.prompt).catch(async () => { await input.type(ctx.prompt, { delay: 12 }) })
    await jitter(300, 800)
    await page.keyboard.press('Enter')

    // Perplexity navigates to /search/... and streams the answer.
    await page.waitForURL(/\/search\//, { timeout: 20_000 }).catch(() => {})
    const settled = await waitForAnswer(page, ctx.timeoutMs)
    if (!settled) throw new Error('answer-timeout')
    await jitter(400, 1000)

    const blockedAfter = await detectBlock(page)
    if (blockedAfter) throw new Error(`blocked:${blockedAfter}`)

    // Answer prose lives in the main content region; sources are anchor
    // links (often carrying a citation index) pointing off-domain.
    const answer = page.locator('main, [class*="prose"]').first()
    const text = (await answer.innerText().catch(() => '')).trim()

    const hrefs = await page.locator('a[href^="http"]').evaluateAll(
      (as) => (as as HTMLAnchorElement[])
        .map((a) => a.href)
        .filter((h) => !h.includes('perplexity.ai'))
    ).catch(() => [] as string[])

    if (!text) throw new Error('empty-answer')

    return {
      text,
      citations: uniq(hrefs.map(hostname)),
      meta: { surface: 'perplexity.ai', logged_out: true },
    }
  },
}

async function waitForAnswer(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  let stable = 0
  let lastLen = -1
  while (Date.now() < deadline) {
    const len = await page.locator('main').first().innerText().then((t) => t.length).catch(() => 0)
    if (len > 80 && len === lastLen) {
      stable += 1
      if (stable >= 3) return true   // text length unchanged across ~2.1s → stream done
    } else {
      stable = 0
    }
    lastLen = len
    await new Promise((r) => setTimeout(r, 700))
  }
  return lastLen > 80
}
