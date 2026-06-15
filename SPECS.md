# Tracque — Overnight Build Specs (greenlight gate)

Kiro-style specs for the autonomous loop. Each runs: build → typecheck →
vite build → **live e2e test** → commit → deploy → adversarial review.
A ticket is "done" only when every acceptance criterion passes. Broken
builds are auto-rejected by Vercel (prod never breaks).

> All 8 are buildable with keys already live (SerpAPI, DataForSEO, OpenAI). None touch billing or need new secrets.

---

### TRQ-43 — Trustpilot / Yelp in Reputation
- **Goal:** Reputation tracks more than Google (Trustpilot dominates CU/SaaS trust; Yelp dominates local).
- **Approach:** Extend `reputation-sync` to also call DataForSEO `business_data/trustpilot/reviews` + `yelp/reviews`; store per-platform rows in `review_profiles` (platform column already exists). Reputation page shows a per-platform rating row.
- **Acceptance:** (1) `review_profiles` gets `trustpilot`/`yelp` rows for a seeded brand; (2) page renders each platform's rating + count; (3) e2e: a real domain returns ≥1 non-google profile; (4) review passes (no cross-client leak).

### TRQ-34 — Keyword Explorer
- **Goal:** Seed keyword → hundreds of ideas with volume/KD (Ubersuggest parity).
- **Approach:** New `keyword-explorer` fn using Labs `keyword_ideas` + `keyword_suggestions`. New `keyword_ideas` table (seed, keyword, volume, difficulty, cpc, intent) client-scoped. UI: SEO page section — input seed → table + "track" button (adds to `keywords`).
- **Acceptance:** (1) seed "crm" returns ≥20 ideas with volume/KD; (2) "track" inserts a keyword scoped to the client; (3) e2e verified live; (4) review passes.

### TRQ-35 — Rank history charts
- **Goal:** Plot position-over-time per keyword (we already store snapshots).
- **Approach:** No new data. New hook reads `seo_results` history per keyword; render a small line chart (Recharts already in deps) on the SEO keyword row (expandable) or a history view.
- **Acceptance:** (1) a keyword with ≥2 snapshots renders a trend line; (2) handles single/zero points gracefully; (3) build + review pass.

### TRQ-23 — Local geo-grid SAIV heatmap
- **Goal:** Local "near me" AI visibility varies block-to-block — show a geo grid, not one score.
- **Approach:** Extend `saiv-scan` to accept a center (geocoded) + grid of N points; per point, prompt ChatGPT "best [category] near [point]"; score inclusion. New `saiv_grid` table (brand_id, lat, lng, mentioned, position). UI: a simple grid/heatmap (colored cells) on the SAIV page.
- **Acceptance:** (1) a 3×3 grid for a local category returns per-cell inclusion; (2) cells color by mentioned/position; (3) e2e on a real local brand; (4) review passes. **Cost guard:** cap grid at 9 points.

### TRQ-25 — Knowledge Panel detection
- **Goal:** Flag whether Google "knows" the brand entity (a strong AI-citation signal).
- **Approach:** SerpAPI knowledge_graph for the brand name; store presence + type in `domain_metrics` (add `has_knowledge_panel`). SEO/Reputation surfaces "✓ Knowledge panel" or "✗ — here's how to get one."
- **Acceptance:** (1) a known brand → panel detected; an obscure one → not; (2) surfaced in UI; (3) e2e verified; (4) review passes.

### TRQ-71 — Compliance scorecard + NCUA one-pager
- **Goal:** The artifact that gets Tracque *through procurement* at a credit union.
- **Approach:** No new data sources. A Compliance page that scores: rate-accuracy pass rate (from `rate_checks`), review response rate, citation freshness; plus a generated, printable **vendor-risk one-pager** (model ownership, data handling, no-PII/no-decisioning, accuracy methodology) — static content + the client's live metrics.
- **Acceptance:** (1) scorecard pulls real `rate_checks`/reputation metrics; (2) one-pager renders printable; (3) build + review pass. (UI-only, low risk.)

### TRQ-12 — White-label client reports
- **Goal:** Agencies hand clients a branded scorecard.
- **Approach:** A shareable report view per client aggregating AI visibility + SEO + reputation + attribution; agency logo/color from the client record; print-to-PDF. Optional public share link (read-only, token-scoped) — **if** added, must be its own RLS-safe token table (no client_id leak).
- **Acceptance:** (1) report renders all sections for a client, scoped correctly; (2) agency branding applied; (3) if share-link built, a token cannot read another client's data (review-verified); (4) review passes.

### TRQ-ONB — Segmented onboarding (SMB / CU / SaaS bridge)
- **Goal:** One product, three front doors — the bridge that lets you serve a plumber *and* big tech.
- **Approach:** Post-signup step: "What are you?" (Local business / Credit union or lender / SaaS / Agency) → stores `segment` on the user/client → tailors default nav emphasis, seeded prompts, and which pages lead (local→Reputation/maps, CU→Rate Monitor, SaaS→SAIV/gaps). New `segment` column on `clients`.
- **Acceptance:** (1) choosing a segment routes to the right first experience + seeds segment-appropriate prompts; (2) persisted; (3) build + review pass.

---

## Loop guardrails (apply to every ticket)
1. **Verify before "done":** real e2e test against live data (seed → run → assert → cleanup), not just compile.
2. **Multi-tenancy:** every new table/view client-scoped + RLS + `security_invoker` views (the pattern that's now been review-verified clean 3×).
3. **Cost caps:** geo-grid ≤9 points; keyword ideas ≤50; no unbounded loops.
4. **Per-ticket commit** so anything is revertable.
5. **Adversarial review** per ticket; if it finds a critical/high, fix before moving on.
6. **Stop conditions:** if a ticket fails its e2e twice, skip it and log for human review rather than force it.

*Greenlight gate: 2026-06-14*
