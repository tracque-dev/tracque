-- ============================================================
-- TRACQUE — Repricing to $0 / $49 / $149 / $399
--
-- Competitors (Profound, HeyAmos) anchor at $99–399. $19 signaled
-- "toy" and didn't cover per-user API cost. New ladder is credibly
-- premium while still undercutting, with revenue attribution gating
-- the climb to Pro.
--
--  Free    $0     1 brand,  10 prompts, 2 models, weekly
--  Starter $49    3 brands, 25 prompts, 5 models, daily, SEO
--  Pro     $149   10 brands,100 prompts,5 models, + attribution + content
--  Agency  $399   unlimited, white-label, API
-- ============================================================

-- New tier needs a column for monthly price (cents) so billing + UI agree.
alter table plan_limits add column if not exists price_cents int default 0;
alter table plan_limits add column if not exists has_content boolean default false;

-- Upsert the four tiers (idempotent).
insert into plan_limits (plan, max_brands, max_keywords, max_scans_day, max_models, has_seo, has_attribution, has_api, has_content, price_cents) values
  ('free',     1,   10,    1,   2, false, false, false, false,     0),
  ('starter',  3,   25,    1,   5, true,  false, false, false,  4900),
  ('pro',      10,  100,   10,  5, true,  true,  false, true,  14900),
  ('agency',   999, 99999, 100, 5, true,  true,  true,  true,  39900)
on conflict (plan) do update set
  max_brands      = excluded.max_brands,
  max_keywords    = excluded.max_keywords,
  max_scans_day   = excluded.max_scans_day,
  max_models      = excluded.max_models,
  has_seo         = excluded.has_seo,
  has_attribution = excluded.has_attribution,
  has_api         = excluded.has_api,
  has_content     = excluded.has_content,
  price_cents     = excluded.price_cents;
