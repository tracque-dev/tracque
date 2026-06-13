// Tracque — Scraper registry
// Maps a scan_tasks.model value → its frontend adapter.
// Add new logged-out surfaces here (gemini, copilot, …) as adapters land.

import type { FrontendScraper } from './types.ts'
import { chatgptScraper } from './chatgpt.ts'
import { perplexityScraper } from './perplexity.ts'

const SCRAPERS: Record<string, FrontendScraper> = {
  [chatgptScraper.model]: chatgptScraper,
  [perplexityScraper.model]: perplexityScraper,
}

export function getScraper(model: string): FrontendScraper | null {
  return SCRAPERS[model] ?? null
}

/** Models that currently have a working frontend adapter. */
export function frontendModels(): string[] {
  return Object.keys(SCRAPERS)
}
