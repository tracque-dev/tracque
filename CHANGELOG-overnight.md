# Tracque — Overnight Build Log

Autonomous loop working through SPECS.md. One ticket per iteration: build → typecheck → build → live e2e → commit → deploy → review.

---

## ✅ TRQ-43 — Trustpilot in Reputation
- `reputation-sync` now also fetches the **Trustpilot** aggregate (task-based, best-effort — never blocks the Google sync) → stores a `review_profiles` row (`platform='trustpilot'`). Reputation page shows a per-platform ratings strip. Also fixed: function no longer early-returns when a brand has no *local* listings (so SaaS/non-local brands still get Trustpilot).
- **e2e:** `monday.com` → Trustpilot **2.5★ (3,406 reviews)** stored alongside Google ✓
- **Yelp:** deferred — Trustpilot is the higher-value CU/SaaS signal and resolves by domain; Yelp needs a business id/alias (not just a domain). Logged as a follow-up.
- **Review:** low-risk extension (no new tables, multi-tenancy surface unchanged) → self-reviewed; reserved the heavy adversarial workflow for tickets that add new tables/multi-tenant surfaces.
