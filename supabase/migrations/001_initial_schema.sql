-- ============================================================
-- TRACQUE — Initial Schema
-- ============================================================

-- Brands (own brand + competitors)
create table brands (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  domain      text,
  type        text not null check (type in ('own', 'competitor')),
  created_at  timestamptz default now()
);

-- Keywords / prompts to track
create table keywords (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  phrase      text not null,
  intent      text check (intent in ('informational', 'commercial', 'navigational')),
  created_at  timestamptz default now()
);

-- Which brands are tracked per keyword
create table brand_keywords (
  keyword_id  uuid references keywords(id) on delete cascade,
  brand_id    uuid references brands(id) on delete cascade,
  primary key (keyword_id, brand_id)
);

-- ============================================================
-- SCAN RESULTS (high-volume — isolated for future migration)
-- ============================================================

-- AI model scan results
create table scan_results (
  id            uuid primary key default gen_random_uuid(),
  keyword_id    uuid references keywords(id) on delete cascade,
  brand_id      uuid references brands(id) on delete cascade,
  model         text not null,  -- 'chatgpt' | 'perplexity' | 'gemini' | 'claude' | 'grok'
  mentioned     boolean not null default false,
  sentiment     text check (sentiment in ('positive', 'neutral', 'negative')),
  position      int,            -- rank within the AI response (1 = first mentioned)
  excerpt       text,           -- verbatim quote from AI response mentioning the brand
  sources       text[],         -- domains cited in the AI response
  raw_response  text,           -- full AI response for auditing
  scanned_at    timestamptz default now()
);

-- Indexes for common query patterns
create index scan_results_brand_scanned on scan_results(brand_id, scanned_at desc);
create index scan_results_keyword_model on scan_results(keyword_id, model, scanned_at desc);
create index scan_results_scanned_at on scan_results(scanned_at desc);

-- SEO rank results (Google via SerpAPI)
create table seo_results (
  id            uuid primary key default gen_random_uuid(),
  keyword_id    uuid references keywords(id) on delete cascade,
  brand_id      uuid references brands(id) on delete cascade,
  position      int,            -- Google ranking position (null = not in top 100)
  url           text,           -- ranking URL
  search_volume int,            -- monthly search volume
  difficulty    int,            -- 0-100 keyword difficulty
  scanned_at    timestamptz default now()
);

create index seo_results_brand_scanned on seo_results(brand_id, scanned_at desc);
create index seo_results_keyword_scanned on seo_results(keyword_id, scanned_at desc);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Latest AI scan per brand/keyword/model
create view latest_scan_results as
select distinct on (keyword_id, brand_id, model)
  sr.*,
  k.phrase,
  b.name as brand_name,
  b.type as brand_type
from scan_results sr
join keywords k on k.id = sr.keyword_id
join brands b on b.id = sr.brand_id
order by keyword_id, brand_id, model, scanned_at desc;

-- Mention rate per brand per model (last 30 days)
create view mention_rates as
select
  b.id as brand_id,
  b.name as brand_name,
  b.user_id,
  sr.model,
  count(*) as total_scans,
  count(*) filter (where sr.mentioned) as mentions,
  round(count(*) filter (where sr.mentioned)::numeric / count(*) * 100, 1) as mention_rate_pct,
  round(
    count(*) filter (where sr.sentiment = 'positive')::numeric /
    nullif(count(*) filter (where sr.mentioned), 0) * 100, 1
  ) as positive_pct
from scan_results sr
join brands b on b.id = sr.brand_id
where sr.scanned_at > now() - interval '30 days'
group by b.id, b.name, b.user_id, sr.model;

-- Latest SEO position per brand/keyword
create view latest_seo_results as
select distinct on (keyword_id, brand_id)
  sr.*,
  k.phrase,
  b.name as brand_name
from seo_results sr
join keywords k on k.id = sr.keyword_id
join brands b on b.id = sr.brand_id
order by keyword_id, brand_id, scanned_at desc;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table brands enable row level security;
alter table keywords enable row level security;
alter table brand_keywords enable row level security;
alter table scan_results enable row level security;
alter table seo_results enable row level security;

-- Users can only see their own data
create policy "brands_owner" on brands for all using (user_id = auth.uid()::text);
create policy "keywords_owner" on keywords for all using (user_id = auth.uid()::text);

create policy "brand_keywords_owner" on brand_keywords for all using (
  exists (select 1 from keywords k where k.id = keyword_id and k.user_id = auth.uid()::text)
);

create policy "scan_results_owner" on scan_results for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text)
);

create policy "seo_results_owner" on seo_results for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text)
);
