-- ============================================================
-- TRACQUE — Scope result views per client (multi-tenancy fix)
--
-- BUG (found in review): client workspaces scoped only the Brands and
-- Keywords lists. Every RESULT surface (SEO ranks, domain authority,
-- competitor table, backlinks, AI mentions, dashboard) showed ALL of an
-- agency's clients merged — Client A's report rendered Client B's data.
--
-- FIX: expose client_id on every result view (via the brand the row
-- belongs to) so hooks can filter by the selected client. Also set
-- security_invoker = true so the underlying per-user RLS actually applies
-- when these views are queried (defense-in-depth against cross-USER leaks).
-- ============================================================

drop view if exists latest_scan_results;
create view latest_scan_results with (security_invoker = true) as
select distinct on (keyword_id, brand_id, model)
  sr.*,
  k.phrase,
  b.name as brand_name,
  b.type as brand_type,
  b.client_id
from scan_results sr
join keywords k on k.id = sr.keyword_id
join brands b on b.id = sr.brand_id
order by keyword_id, brand_id, model, scanned_at desc;

drop view if exists latest_seo_results;
create view latest_seo_results with (security_invoker = true) as
select distinct on (keyword_id, brand_id)
  sr.*,
  k.phrase,
  b.name as brand_name,
  b.client_id
from seo_results sr
join keywords k on k.id = sr.keyword_id
join brands b on b.id = sr.brand_id
order by keyword_id, brand_id, scanned_at desc;

drop view if exists mention_rates;
create view mention_rates with (security_invoker = true) as
select
  b.id as brand_id,
  b.name as brand_name,
  b.user_id,
  sr.model,
  sum(sr.runs_total) as total_runs,
  sum(sr.runs_mentioned) as total_mentions,
  round(sum(sr.runs_mentioned)::numeric / nullif(sum(sr.runs_total), 0) * 100, 1) as mention_rate_pct,
  round(avg(sr.confidence_pct), 0) as avg_confidence,
  round(
    count(*) filter (where sr.sentiment = 'positive')::numeric /
    nullif(count(*) filter (where sr.mentioned), 0) * 100, 1
  ) as positive_pct,
  max(sr.scanned_at) as last_scanned,
  b.client_id
from scan_results sr
join brands b on b.id = sr.brand_id
where sr.scanned_at > now() - interval '30 days'
group by b.id, b.name, b.user_id, sr.model, b.client_id;

drop view if exists domain_overview;
create view domain_overview with (security_invoker = true) as
select dm.*, b.name as brand_name, b.user_id, b.type, b.client_id
from domain_metrics dm
join brands b on b.id = dm.brand_id;
