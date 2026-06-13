// Tracque — Frontend scraper contract
// Every platform adapter implements FrontendScraper. The worker
// (scrape-task) is platform-agnostic: it claims an identity, opens a
// managed browser, and hands a Page to the right adapter.

import type { Page } from 'npm:playwright-core@1.48.0'

export interface ScrapeResult {
  text: string                 // the model's full answer
  citations: string[]          // citation hostnames (deduped, www-stripped)
  raw_html?: string            // optional: captured answer DOM for debugging
  meta?: Record<string, unknown>
}

export interface ScraperContext {
  prompt: string
  geo: string                  // e.g. 'us' — for logging / future geo assertions
  timeoutMs: number
}

export interface FrontendScraper {
  /** Stable key — matches the `model` value on scan_tasks. */
  readonly model: string
  /** Human label for logs/dashboards. */
  readonly label: string
  /** Whether this surface needs an authenticated identity (false = logged-out). */
  readonly requiresAuth: boolean
  /** Drive the page: submit prompt, wait for the answer, extract it. */
  run(page: Page, ctx: ScraperContext): Promise<ScrapeResult>
}

/** Normalize a URL to a bare hostname for citation grouping. */
export function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Dedupe + drop falsy. */
export function uniq(xs: (string | null | undefined)[]): string[] {
  return [...new Set(xs.filter((x): x is string => !!x))]
}
