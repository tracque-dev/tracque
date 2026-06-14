-- ============================================================
-- TRACQUE — Conversion + GA4 Attribution layer
--
-- Closes the loop: AI mention → click → conversion → revenue.
-- A first-party tracking snippet beacons visits + conversions to the
-- public `track` edge function, which classifies the source (chatgpt,
-- perplexity, google, paid, …) and stores client-scoped rows. The
-- Attribution page reads attribution_by_source.
--
-- Every table carries user_id + client_id (resolved from the site_key at
-- ingest) so reporting is client-scoped — same discipline as the result
-- views after the multi-tenancy fix.
-- ============================================================

-- A trackable site/snippet. One public site_key per client workspace.
create table if not exists tracking_sites (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  client_id   uuid references clients(id) on delete cascade,
  site_key    text unique not null default replace(gen_random_uuid()::text, '-', ''),
  domain      text,
  ga4_id      text,                      -- optional: customer's GA4 Measurement ID (G-XXXX) for event mirroring
  created_at  timestamptz default now()
);
create index if not exists tracking_sites_user on tracking_sites(user_id);

-- Anonymous visit touches (one per session-source).
create table if not exists attribution_visits (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  client_id    uuid references clients(id) on delete set null,
  visitor_id   text not null,            -- first-party cookie id
  source       text not null,            -- chatgpt | perplexity | gemini | claude | grok | copilot | google | bing | paid_google | paid_meta | referral | direct
  is_ai        boolean default false,
  medium       text,
  campaign     text,
  referrer     text,
  landing_path text,
  country      text,
  created_at   timestamptz default now()
);
create index if not exists attr_visits_scope on attribution_visits(user_id, client_id, source);
create index if not exists attr_visits_visitor on attribution_visits(visitor_id);

-- Conversions (form submit, call, signup, purchase) with optional revenue.
create table if not exists attribution_conversions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  client_id    uuid references clients(id) on delete set null,
  visitor_id   text not null,
  source       text,                     -- last-touch source carried from the visitor's cookie
  is_ai        boolean default false,
  event_name   text not null default 'conversion',
  value        numeric,                  -- revenue, if known
  currency     text default 'USD',
  created_at   timestamptz default now()
);
create index if not exists attr_conv_scope on attribution_conversions(user_id, client_id, source);

-- ── Aggregated, client-scoped view for the Attribution page ─
create view attribution_by_source with (security_invoker = true) as
with v as (
  select user_id, client_id, source, bool_or(is_ai) as is_ai,
         count(*) as sessions, count(distinct visitor_id) as visitors
  from attribution_visits group by user_id, client_id, source
),
c as (
  select user_id, client_id, source,
         count(*) as conversions, coalesce(sum(value), 0) as revenue
  from attribution_conversions group by user_id, client_id, source
)
select
  coalesce(v.user_id, c.user_id)       as user_id,
  coalesce(v.client_id, c.client_id)   as client_id,
  coalesce(v.source, c.source)         as source,
  coalesce(v.is_ai, false)             as is_ai,
  coalesce(v.sessions, 0)              as sessions,
  coalesce(v.visitors, 0)             as visitors,
  coalesce(c.conversions, 0)          as conversions,
  coalesce(c.revenue, 0)              as revenue
from v
full outer join c
  on v.user_id = c.user_id
 and v.client_id is not distinct from c.client_id
 and v.source = c.source;

-- ── RLS ────────────────────────────────────────────────────
alter table tracking_sites          enable row level security;
alter table attribution_visits      enable row level security;
alter table attribution_conversions enable row level security;

create policy "tracking_sites_owner" on tracking_sites for all using (user_id = auth.uid()::text);
create policy "attr_visits_owner" on attribution_visits for all using (user_id = auth.uid()::text);
create policy "attr_conv_owner" on attribution_conversions for all using (user_id = auth.uid()::text);
