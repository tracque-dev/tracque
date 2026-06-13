// Tracque — ChatGPT (logged-out) scraper
//
// chatgpt.com serves a logged-out experience. We submit the prompt,
// wait for the streamed answer to settle, and extract the assistant
// message text + any inline citation links.
//
// NOTE: OpenAI changes this DOM frequently. Selectors are layered with
// fallbacks; when they all miss, the worker logs a 'failed' scrape_session
// and the health view surfaces the breakage for a quick selector patch.

import type { Page } from 'npm:playwright-core@1.48.0'
import { type FrontendScraper, type ScrapeResult, type ScraperContext, hostname, uniq } from './types.ts'
import { detectBlock, jitter } from './browser.ts'

export const chatgptScraper: FrontendScraper = {
  model: 'chatgpt',
  label: 'ChatGPT (web)',
  requiresAuth: false,

  async run(page: Page, ctx: ScraperContext): Promise<ScrapeResult> {
    await page.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: ctx.timeoutMs })
    await jitter()

    const blocked = await detectBlock(page)
    if (blocked) throw new Error(`blocked:${blocked}`)

    // Dismiss the "stay logged out" / cookie interstitials if present.
    for (const sel of [
      'a:has-text("Stay logged out")',
      'button:has-text("Stay logged out")',
      'button:has-text("Accept all")',
      'button:has-text("Reject")',
    ]) {
      const el = page.locator(sel).first()
      if (await el.count().catch(() => 0)) { await el.click().catch(() => {}); await jitter(200, 600) }
    }

    // The composer: prefer the ProseMirror/textarea, fall back to role.
    const input = page.locator(
      '#prompt-textarea, textarea[data-testid="prompt-textarea"], div[contenteditable="true"], textarea'
    ).first()
    await input.waitFor({ state: 'visible', timeout: ctx.timeoutMs })
    await input.click()
    await jitter()
    await input.fill(ctx.prompt).catch(async () => {
      // contenteditable divs sometimes reject fill(); type instead.
      await input.type(ctx.prompt, { delay: 12 })
    })
    await jitter(300, 900)
    await page.keyboard.press('Enter')

    // Wait for streaming to finish: the send button flips back from a
    // "stop generating" state. We poll for the stop control to disappear.
    const settled = await waitForAnswer(page, ctx.timeoutMs)
    if (!settled) throw new Error('answer-timeout')
    await jitter(400, 1000)

    const blockedAfter = await detectBlock(page)
    if (blockedAfter) throw new Error(`blocked:${blockedAfter}`)

    // Grab the last assistant turn.
    const turn = page.locator(
      '[data-message-author-role="assistant"], div[data-testid^="conversation-turn"]'
    ).last()

    const text = (await turn.innerText().catch(() => '')).trim()
    const hrefs = await turn.locator('a[href^="http"]').evaluateAll(
      (as) => (as as HTMLAnchorElement[]).map((a) => a.href)
    ).catch(() => [] as string[])

    if (!text) throw new Error('empty-answer')

    return {
      text,
      citations: uniq(hrefs.map(hostname)),
      meta: { surface: 'chatgpt.com', logged_out: true },
    }
  },
}

/** Poll until the "stop generating" affordance is gone (stream done). */
async function waitForAnswer(page: Page, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  // First, wait for generation to *start* (stop button appears).
  await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop"]')
    .first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})

  while (Date.now() < deadline) {
    const stopping = await page
      .locator('button[data-testid="stop-button"], button[aria-label*="Stop"]')
      .first().count().catch(() => 0)
    if (!stopping) {
      // Confirm an assistant message actually rendered.
      const has = await page.locator('[data-message-author-role="assistant"]').count().catch(() => 0)
      if (has) return true
    }
    await new Promise((r) => setTimeout(r, 700))
  }
  return false
}
