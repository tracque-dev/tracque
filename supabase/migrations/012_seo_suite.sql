-- ============================================================
-- TRACQUE — SEO Suite (Ahrefs-grade data model)
--
-- Rank tracking comes from SerpAPI (real Google SERP → position).
-- Keyword metrics, backlinks, and domain authority come from
-- DataForSEO (wholesale SEO data) — the same approach Ahrefs
-- alternatives use instead of building a web-scale crawl index.
--
-- Tables:
--   seo_results       (existing) per (keyword,brand) rank snapshot — + cpc
--   keyword_metrics   per keyword: volume, difficulty, cpc, trend
--   domain_metrics    per brand: DR, organic traffic, kw count, ref domains
--   backlinks         per brand: referring pages with anchor + DR
-- ============================================================

-- Rank snapshot gains CPC alongside existing volume/difficulty.
alter table seo_results add column if not exists cpc numeric;

-- ── Keyword metrics (one current row per keyword) ──────────
create table if not exists keyword_metrics (
  keyword_id    uuid primary key references keywords(id) on delete cascade,
  search_volume int,
  difficulty    int,            -- 0–100 (KD)
  cpc           numeric,
  competition   numeric,        -- 0–1 paid competition
  trend         jsonb,          -- [{month, volume}, ...] 12-mo history
  updated_at    timestamptz default now()
);

-- ── Domain authority / overview (one current row per brand) ─
create table if not exists domain_metrics (
  brand_id          uuid primary key references brands(id) on delete cascade,
  domain            text,
  domain_rating     int,        -- 0–100 (DR / authority)
  organic_traffic   bigint,     -- est. monthly organic visits
  organic_keywords  int,        -- # ranking keywords
  referring_domains int,
  backlinks_total   bigint,
  updated_at        timestamptz default now()
);

-- ── Backlinks (top referring pages per brand) ──────────────
create table if not exists backlinks (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid references brands(id) on delete cascade,
  source_domain text,
  source_url    text,
  target_url    text,
  anchor        text,
  domain_rating int,
  dofollow      boolean default true,
  first_seen    date,
  created_at    timestamptz default now()
);
create index if not exists backlinks_brand on backlinks(brand_id, domain_rating desc);

-- ── RLS (owner-scoped via parent brand/keyword) ────────────
alter table keyword_metrics enable row level security;
alter table domain_metrics  enable row level security;
alter table backlinks       enable row level security;

create policy "keyword_metrics_owner" on keyword_metrics for all using (
  exists (select 1 from keywords k where k.id = keyword_id and k.user_id = auth.uid()::text)
);
create policy "domain_metrics_owner" on domain_metrics for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text)
);
create policy "backlinks_owner" on backlinks for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text)
);

-- ── Convenience view: domain overview + brand name ─────────
create or replace view domain_overview as
select dm.*, b.name as brand_name, b.user_id, b.type
from domain_metrics dm
join brands b on b.id = dm.brand_id;
