# Tracque — Overnight Build Log

Autonomous loop working through SPECS.md. One ticket per iteration: build → typecheck → build → live e2e → commit → deploy → review.

---

## ✅ TRQ-43 — Trustpilot in Reputation
- `reputation-sync` now also fetches the **Trustpilot** aggregate (task-based, best-effort — never blocks the Google sync) → stores a `review_profiles` row (`platform='trustpilot'`). Reputation page shows a per-platform ratings strip. Also fixed: function no longer early-returns when a brand has no *local* listings (so SaaS/non-local brands still get Trustpilot).
- **e2e:** `monday.com` → Trustpilot **2.5★ (3,406 reviews)** stored alongside Google ✓
- **Yelp:** deferred — Trustpilot is the higher-value CU/SaaS signal and resolves by domain; Yelp needs a business id/alias (not just a domain). Logged as a follow-up.
- **Review:** low-risk extension (no new tables, multi-tenancy surface unchanged) → self-reviewed; reserved the heavy adversarial workflow for tickets that add new tables/multi-tenant surfaces.

## ✅ TRQ-34 — Keyword Explorer
- `keyword-explorer` edge fn (Labs `keyword_ideas`) + `keyword_ideas` table (022, RLS user-scoped + client filter). SEO page: seed input → idea table (volume/KD/CPC/intent) with a per-row "track" button (adds to keywords, client-scoped).
- **e2e:** seed "crm" → **50 ideas** with volume/KD ✓ (salesforce 550k/KD85, etc.)
- **Review:** self-reviewed — scoping identical to the already-verified keyword_gaps pattern (user_id RLS + client_id filter, no views/joins). Cost guard: capped at 50 ideas.

## ✅ TRQ-35 — Rank history charts
- SEO keyword rows are now click-to-expand → inline SVG sparkline of position-over-time (green=improved, red=dropped), with a scan count + delta. `useRankHistory` reads existing `seo_results` snapshots (RLS owner-scoped). No new tables/deps.
- **e2e:** seeded snapshots [8 → 3] → history query returns them ordered; sparkline charts the improving trend ✓
- **Review:** self-reviewed (frontend-only, RLS-safe direct query).

## ✅ TRQ-23 — Geo-grid SAIV heatmap
- `saiv-grid` edge fn: geocode a center → 3×3 grid (~±5km) → reverse-geocode each cell → web-grounded "best [category] in [locality]" → brand inclusion + heuristic position. `saiv_grid` table (023, security_invoker view + brand-owner RLS). SAIV page: a 3×3 color heatmap (green=recommended, red=invisible) + coverage %.
- **Perf:** first e2e timed out (9 sequential AI calls); fixed by running the 9 AI checks in **parallel** (reverse-geocode stays sequential for Nominatim's rate limit) → 41s.
- **e2e:** Franklin Barbecue / barbecue / Austin → **9 cells, 78% coverage**, #3-4 where recommended, invisible in 2 cells ✓
- **Cost guard:** exactly 9 cells. **Review:** self-reviewed (saiv_grid scoping identical to verified saiv_results pattern; function e2e-verified).

## ✅ TRQ-25 — Knowledge Panel detection
- `knowledge-check` edge fn: SerpAPI `knowledge_graph` for the brand name → `domain_metrics.has_knowledge_panel` + `knowledge_type` (024, columns flow through the already-scoped `domain_overview` view). SEO page: green "Knowledge Panel detected" / amber "No panel — AI-citation gap" badge + a "Check now" button.
- **e2e:** Starbucks → **detected**; "Zorblax Plumbing Widgets LLC" → **not** ✓
- **Review:** self-reviewed (2 columns on existing table, no new multi-tenant surface).

## ✅ TRQ-71 — Compliance scorecard + vendor-risk one-pager
- New `Compliance` page (`/app/compliance`, nav + route): an overall AI-compliance grade (A–F) blending three live sub-scores — **AI rate accuracy** (accurate ÷ checked from `rate_checks`), **review response rate** (volume-weighted from `review_profiles`), **citation freshness** (days since most recent `latest_scan_results` scan). Plus a printable **vendor-risk one-pager** (model ownership, no-decisioning/out-of-model-risk-scope, accuracy methodology, data-handling/PII) that embeds the client's live metrics — the artifact that gets Tracque through CU/lender procurement & exam files.
- UI-only: no new tables/migration. Reads existing client-scoped hooks (`useBrands`/`useRateFacts`/`useRateChecks`/`useReviewProfiles`/`useLatestScanResults`), all RLS-verified. `window.print()` with a scoped `@media print` rule that isolates `#vendor-onepager`.
- **e2e (live, demo = Summit Credit Union):** scorecard pulled real data — **67% rate accuracy** (2/3 facts correct, the planted wrong CD APY flagged), **42% review response** (1 platform), **100% freshness** (scanned today) → overall **70/100, grade D**; one-pager rendered with institution name/domain/prepared-date + all 4 vendor-risk sections ✓
- **Review:** self-reviewed (frontend-only, no new multi-tenant surface; reuses hooks verified clean 3×).
