-- ============================================================
-- TRACQUE — Enterprise tier (custom pricing)
--
-- Mirrors Profound/HeyAmos: a top "contact sales" tier above the
-- self-serve plans. price_cents = null → quoted, not self-serve.
-- ============================================================

insert into plan_limits (plan, max_brands, max_keywords, max_scans_day, max_models, has_seo, has_attribution, has_api, has_content, price_cents) values
  ('enterprise', 999999, 999999, 999999, 5, true, true, true, true, null)
on conflict (plan) do update set
  max_brands = excluded.max_brands, max_keywords = excluded.max_keywords,
  max_scans_day = excluded.max_scans_day, has_seo = excluded.has_seo,
  has_attribution = excluded.has_attribution, has_api = excluded.has_api,
  has_content = excluded.has_content, price_cents = excluded.price_cents;
