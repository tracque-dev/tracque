-- ============================================================
-- TRACQUE — Reputation portal (DataForSEO Business Data)
--
-- Reviews drive what AI recommends: models exclude businesses near
-- ~3.4 stars / low response-rate and favor ~4.3+. So we track ratings,
-- review volume, response rate, and the local competitive set — then
-- show "distance to AI-recommendable."
--
-- Client-scoped via the brand (consistent with the multi-tenancy fix).
-- ============================================================

-- Per-brand, per-platform rating snapshot.
create table if not exists review_profiles (
  brand_id        uuid references brands(id) on delete cascade,
  platform        text not null,            -- google | trustpilot | yelp | tripadvisor
  rating          numeric,
  reviews_count   int,
  response_rate   numeric,                  -- 0–1, share of reviews with an owner reply
  place_id        text,
  topics          jsonb,                    -- aspect themes [{topic, count}]
  updated_at      timestamptz default now(),
  primary key (brand_id, platform)
);

-- Individual reviews (most recent N per brand/platform).
create table if not exists reviews (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid references brands(id) on delete cascade,
  platform      text not null,
  author        text,
  rating        numeric,
  text          text,
  owner_answered boolean default false,
  posted_at     date,
  created_at    timestamptz default now()
);
create index if not exists reviews_brand on reviews(brand_id, posted_at desc);

-- Local competitive set (Share-of-Local-Voice grid) — snapshot per brand.
create table if not exists local_competitors (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid references brands(id) on delete cascade,
  name          text,
  rating        numeric,
  reviews_count int,
  is_claimed    boolean,
  is_self       boolean default false,      -- the client's own listing in the set
  created_at    timestamptz default now()
);
create index if not exists local_comp_brand on local_competitors(brand_id, rating desc);

-- ── Client-scoped views (security_invoker so per-user RLS applies) ──
create view review_profiles_scoped with (security_invoker = true) as
select rp.*, b.name as brand_name, b.user_id, b.client_id, b.type
from review_profiles rp join brands b on b.id = rp.brand_id;

create view local_competitors_scoped with (security_invoker = true) as
select lc.*, b.user_id, b.client_id
from local_competitors lc join brands b on b.id = lc.brand_id;

-- ── RLS (owner-scoped via parent brand) ────────────────────
alter table review_profiles   enable row level security;
alter table reviews           enable row level security;
alter table local_competitors enable row level security;

create policy "review_profiles_owner" on review_profiles for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
create policy "reviews_owner" on reviews for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
create policy "local_competitors_owner" on local_competitors for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
