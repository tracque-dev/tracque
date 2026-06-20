# Tracque — Steering Doc

> Single source of truth for project direction, decisions, current state, and conventions.
> Read this first in any new session. Last updated: 2026-06-20.

---

## 1. Product

**Tracque** = AI brand-visibility + SEO + reputation + revenue-attribution platform.
Tracks whether ChatGPT/Claude/Gemini/Perplexity/Grok recommend your brand, then ties
it through to SEO rank, reputation, and revenue.

**The wedge / moat:** credit unions, lenders, and local SMBs. The killer differentiator
is the **AI Rate-Accuracy Monitor** — catches when an AI states a CU's rate/fee/hours
*wrong* (e.g. ChatGPT says CD APY 3.25% when it's 4.50%). That's a UDAAP / compliance
exposure no competitor touches → unlocks the CEO/CCO (risk) budget, not just marketing.

**Positioning vs competitors** (Profound / HeyAmos / Peec, all horizontal AEO tools):
- We are NOT as deep as them on pure AI-visibility (Profound has 10+ engines, real
  front-end capture, conversation/search-volume data; we have fewer engines, API-based).
- We win on the **vertical bundle**: visibility + SEO + reputation + rate-accuracy
  compliance + attribution, aimed at CUs/SMBs — a buyer + surface none of them serve.
- Strategy: don't out-Profound Profound on the visibility arms race; own the
  compliance wedge + the bundle + the vertical. Sell **direct** to CMO/CEO (relationship
  sale), NOT via a self-serve website lead magnet.

---

## 2. Architecture / Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui. Package manager: `bun`
  (`~/.bun/bin/bun`). Hosted on **Vercel** (`tracque.com`). SPA rewrite in `vercel.json`.
- **Backend:** **Supabase** project ref `poarbxoeswwxexwnrugp`.
  - Postgres + Auth + Edge Functions (Deno) + RLS + `pg_cron` + `pg_net` + Vault.
  - Migrations in `supabase/migrations/` (001..027).
- **Repo:** `github.com/tracque-dev/tracque` (lives at `/Users/john/tracque`).
  ⚠️ This Claude session is rooted in `/Users/john/adcountable` (a *separate* product);
  tracque is previewed via a symlink bridge `adcountable/.claude/tracque-preview →
  /Users/john/tracque`. For native work, open `/Users/john/tracque` as its own project.

### Multi-tenancy (the pattern — keep it)
Every table is client-scoped via `brand_id`/`user_id`+`client_id`. RLS owner policy:
`using (user_id = auth.uid()::text)` (or via the owning brand). Result **views** are
`security_invoker = true`. Migration **026** added ownership-tied `WITH CHECK` on
`client_reports`/`brands`/`keywords` so a tenant can't write another tenant's `client_id`
(closed a HIGH token-squat finding). This has been adversarially reviewed clean 3×.

---

## 3. Current state — built & verified this session

| Feature | State | Notes |
|---|---|---|
| **Multi-engine AI scan** | ✅ live | `run-scan` routes Claude/Gemini/Perplexity through **DataForSEO LLM Responses** (one key) when their native key is absent. 1 engine → 3 live (ChatGPT native + Gemini + Perplexity via DFS). Verified live (Bellco CU). |
| **Continuous scans** | ✅ live | `scheduled-scan` edge fn + `pg_cron` `daily-scan-trigger` (6am UTC) runs `run-scan` for every active account (demo excluded), time-bounded. Replaced the broken empty-job cron. Secured by `CRON_SECRET` held in Vault. |
| **Action layer (recommendations)** | ✅ live | `generate-recommendations` made provider-flexible → uses OpenAI when Anthropic key absent. Verified: 8 real CU recs for Summit. |
| **Share of AI Voice** | ✅ live | `Saiv.tsx` now computes a TRUE normalized competitive share (you vs every brand AI names) + you-vs-field leaderboard, plus a separate "AI inclusion rate". |
| **Onboarding** | ✅ built | `Onboarding.tsx` (`/app/onboarding`): segment (CU/local/SaaS/agency) → name+city+category → seeds brand + segment keywords + CU rate sheet + fires first scan. Dashboard redirects brandless accounts here. |
| **Auth signup** | ✅ fixed | `signUp` now uses the returned session (auto-confirm on) instead of always showing "check your email". Supabase `mailer_autoconfirm = true` (instant signup, no email) — set for beta; turn OFF + wire SMTP before public launch. |
| **White-label client reports** | ✅ live | `/app/report` + public `/r/:token` via `shared-report` edge fn (token→one client, server-side scoped). Security-reviewed. |
| **ErrorBoundary + Sentry** | ✅ shipped | top-level boundary (no white-screens); Sentry init gated on `VITE_SENTRY_DSN` (no-op without it). |
| **Legal pages** | ✅ shipped | `/privacy` + `/terms` (templates — need counsel review). |
| **Compliance scorecard + vendor one-pager** | ✅ live | `/app/compliance`. |

Earlier overnight build (also live): Trustpilot reputation, Keyword Explorer, rank
history, geo-grid SAIV, Knowledge Panel.

Docs in repo: `BACKLOG.md` (Jira-style tickets), `SPECS.md`, `CHANGELOG-overnight.md`.

---

## 4. Design — direction & history

The look has been iterated several times. **Current decision: DARK, Linear/Vercel-grade.**

1. **"Tracque OS" violet** (committed, was deployed) — light canvas, violet `#7B5BF5`,
   Space Grotesk display, ink blocks, "rail" motif, `eyebrow` mono labels.
2. **Electric-blue brand kit** (official kit, `f1996342`) — `#2D7FF9` electric blue,
   `#08111F` midnight, `#F8FAFC` off-white, slate, **Geist** font, new track+arrow logo.
   → **HELD / reverted** (`c5ae9cc1`) at user request; recoverable by reverting the revert
   or cherry-picking `f1996342`. Prod stayed violet.
3. **DARK Linear/Vercel-grade** (CURRENT, in progress) — near-black `#0C0C0E` canvas,
   hairline borders, sharp `0.5rem` radius, mono micro-labels, ONE restrained accent =
   electric blue (`--primary #2D7FF9`). Inter display (tight tracking). Dashboard +
   sidebar done; full 23-page rollout was running; **not yet deployed** when this doc
   was written — compile + fix + deploy when the rollout lands.

**Design tokens** live in `src/index.css` (`:root` HSL vars) + `tailwind.config.ts`.
Utility conventions kept across redesigns: `.eyebrow` (mono uppercase micro-label),
`.font-display`, `.nums` (tabular), `.bg-ink`/`.bg-ink-grad`, `.rails` motif, `.shadow-card`.
Cards: `bg-card border border-border rounded-xl`. Accent via `primary` token (not hardcoded).

**Logo:** PENDING. User wants it generated via **Nutlope/logocreator** (Flux Pro 1.1 on
Together AI, hosted free at logo-creator.io, outputs PNG). Blocked on a **Together AI API
key** (then generate via Flux directly) OR a PNG from the hosted site → wire into favicon,
sidebar, nav, reports, `src/components/Logo.tsx` (the single `Mark` component).
John did not love the hand-drawn SVG attempts — use the real generated asset.

**Process rule learned:** for any redesign, prototype ONE flagship screen + get sign-off
before rolling across all pages. Token-driven so global re-skins are cheap; hardcoded
light colors (esp. `Landing.tsx`) are the risk.

---

## 5. AI engine coverage

`run-scan` enables an engine if its native key is set OR DataForSEO can serve it.
- **ChatGPT** — ✅ OpenAI key (native).
- **Gemini, Perplexity** — ✅ via DataForSEO (`gemini-2.5-flash`, `sonar`).
- **Claude** — ⚠️ DataForSEO rejects `model_name` (Claude not entitled on the DFS account).
  Lights up automatically once Claude is enabled on DataForSEO OR `ANTHROPIC_API_KEY` is set.
- **Grok** — ⚠️ not offered by DataForSEO; needs `XAI_API_KEY`.
- Marketing claims "all 5 engines" — only true once those two switches are flipped.

DataForSEO also exposes `ai_keyword_data` (AI search *volume* — the Profound "Conversation
Explorer" equivalent) — tappable next with the same key.

---

## 6. Operational

- **Secrets (set as Supabase function secrets):** `OPENAI_API_KEY`, `SERP_API_KEY`,
  `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD`, `CRON_SECRET`. NOT set: `ANTHROPIC_API_KEY`,
  `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `XAI_API_KEY`, `VITE_SENTRY_DSN`. (Values are
  never committed — referenced by name only.)
- **Cron auth pattern:** `pg_cron` job calls edge fns via `net.http_post`; the secret
  (`cron_secret`) is stored in **Supabase Vault** and read inline in the cron SQL — never
  hardcoded in a migration. (See migration 027; the Vault `create_secret` is run
  out-of-band, not committed.)
- **Auth config** (Supabase Management API): Site URL = `https://tracque.com`,
  `uri_allow_list = https://tracque.com/**`, `mailer_autoconfirm = true` (beta).
- **Deploy:** `bun x vercel --prod --yes --token <vcp_… tracque-devs-projects>`. Vercel
  rejects broken builds, so prod never breaks. Git push ≠ deploy (deploy is manual).
- **Migrations:** `supabase db push --linked`. Service-role key via
  `supabase projects api-keys`. Management-API SQL via curl (urllib gets Cloudflare 403).
- **Demo account:** `demo@tracque.com` / `TracqueDemo2026!` = Summit Credit Union, seeded
  by `scripts/seed_demo.py` (fully fabricated fixture — excluded from continuous scans so
  it stays curated). Real accounts pull live data on signup.

---

## 7. Pending — path to sales-ready

Sales-ready (direct CU sale) = demo that closes ✅ + ability to transact ❌ + trust ❌ + proof ❌.

**P0 (blockers):**
- **Billing** — no Stripe / plans / invoicing / quotas. Can't charge; paid-API cost is
  uncapped per account. The real gate to taking paying customers. (TRQ-81, deferred.)
- **2 missing engine keys** — Claude (DataForSEO entitlement or Anthropic key) + Grok
  (xAI key). John's switches.

**P1:**
- Trust pack: DPA + security one-pager + "SOC 2 in progress" (CU vendor review gate).
- Finish + deploy the dark redesign; wire the real logo.
- SMTP (Resend/Postmark) + turn `mailer_autoconfirm` off before public launch.

**P2:**
- 2–3 design-partner CUs + a quantified win + reference logo (John's outreach).
- Error/empty states on pages; code-splitting (single ~640KB chunk).
- `model_costs`/`plan_limits` tables lack RLS (config tables, low risk).
- `USER_ID = 'demo-user'` legacy fallback in `useUserId` (low risk; ProtectedRoute guards).

**"Feels finished" levers** (John's stated concern): continuous auto-scans ✅,
all engines (pending keys), onboarding ✅. Indispensability: scheduled exam-ready
compliance report, rate-sheet sync + alerting, deposit/loan attribution, peer benchmarks.

---

## 8. Conventions

- Per-feature commits, descriptive messages, `Co-Authored-By` trailer.
- New tables/multi-tenant surfaces → migration with RLS + owner policy + `security_invoker`
  views + `client_id` ownership-tied `WITH CHECK`; then an adversarial review before "done".
- Live e2e per feature (seed via service role → invoke fn → assert → cleanup) — not just compile.
- Cost caps on scans (geo-grid ≤9, keyword ideas ≤50, continuous-scan time-bounded + ≤25 users/run).
- Edge functions: service-role client internally; public ones (`track`, `shared-report`,
  `scheduled-scan`) deployed `--no-verify-jwt` and gated by their own token/secret logic.
