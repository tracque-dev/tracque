-- ============================================================
-- TRACQUE — Keyword Gap + competitor discovery (DataForSEO Labs)
--
-- competitors_domain → who you really compete with in search.
-- domain_intersection (intersections:false) → keywords a competitor
-- ranks for that you DON'T (the gap). Both are live Labs calls.
-- Client-scoped via the brand.
-- ============================================================

create table if not exists seo_competitors (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references brands(id) on delete cascade,
  domain          text,
  common_keywords int,
  organic_traffic bigint,
  created_at      timestamptz default now()
);
create index if not exists seo_competitors_brand on seo_competitors(brand_id, common_keywords desc);

create table if not exists keyword_gaps (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid references brands(id) on delete cascade,
  competitor_domain   text,
  keyword             text,
  search_volume       int,
  difficulty          int,
  cpc                 numeric,
  competitor_position int,
  intent              text,
  created_at          timestamptz default now()
);
create index if not exists keyword_gaps_brand on keyword_gaps(brand_id, search_volume desc);

create view keyword_gaps_scoped with (security_invoker = true) as
select kg.*, b.user_id, b.client_id from keyword_gaps kg join brands b on b.id = kg.brand_id;

create view seo_competitors_scoped with (security_invoker = true) as
select sc.*, b.user_id, b.client_id from seo_competitors sc join brands b on b.id = sc.brand_id;

alter table keyword_gaps    enable row level security;
alter table seo_competitors enable row level security;
create policy "keyword_gaps_owner" on keyword_gaps for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
create policy "seo_competitors_owner" on seo_competitors for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
