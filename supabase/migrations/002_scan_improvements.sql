-- ============================================================
-- TRACQUE — Scan Engine v2
-- Adds: confidence scoring, multi-run aggregation,
--       structured citations, Google AI Overviews
-- ============================================================

-- Add confidence + multi-run fields to scan_results
alter table scan_results
  add column if not exists runs_total      int not null default 1,
  add column if not exists runs_mentioned  int not null default 0,
  add column if not exists confidence_pct  int,          -- 0-100, mentions/runs * 100
  add column if not exists citation_urls   text[],       -- structured URLs from Perplexity/Gemini
  add column if not exists all_sentiments  text[],       -- raw sentiment per run for averaging
  add column if not exists web_grounded    boolean default false; -- was web search enabled?

-- Google AI Overviews (separate from model scans)
create table if not exists ai_overviews (
  id               uuid primary key default gen_random_uuid(),
  keyword_id       uuid references keywords(id) on delete cascade,
  snippet          text,           -- the full AI Overview text
  brands_mentioned text[],         -- brands detected in the overview
  cited_urls       text[],         -- sources Google cited
  scanned_at       timestamptz default now()
);

create index if not exists ai_overviews_keyword on ai_overviews(keyword_id, scanned_at desc);

-- Source intelligence table — tracks which URLs drive AI mentions
create table if not exists citation_sources (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  domain       text not null,        -- e.g. "g2.com", "techcrunch.com"
  mention_count int default 1,        -- how many times this domain cited this brand
  models       text[],               -- which models cite this domain for this brand
  first_seen   timestamptz default now(),
  last_seen    timestamptz default now()
);

create unique index if not exists citation_sources_brand_domain on citation_sources(brand_id, domain);

-- Updated mention_rates view with confidence
drop view if exists mention_rates;
create view mention_rates as
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
  max(sr.scanned_at) as last_scanned
from scan_results sr
join brands b on b.id = sr.brand_id
where sr.scanned_at > now() - interval '30 days'
group by b.id, b.name, b.user_id, sr.model;

-- RLS for new tables
alter table ai_overviews enable row level security;
alter table citation_sources enable row level security;

create policy "ai_overviews_owner" on ai_overviews for all using (
  exists (select 1 from keywords k where k.id = keyword_id and k.user_id = auth.uid()::text)
);

create policy "citation_sources_owner" on citation_sources for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text)
);
