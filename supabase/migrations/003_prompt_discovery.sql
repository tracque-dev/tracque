-- ============================================================
-- TRACQUE — Prompt Discovery & Data Sources
-- ============================================================

-- Discovered prompts — questions real people ask about your industry
create table if not exists discovered_prompts (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  phrase       text not null,
  source       text not null check (source in (
    'people_also_ask',   -- Google PAA via SerpAPI
    'autocomplete',      -- Google autocomplete
    'perplexity_related',-- Related questions from Perplexity API
    'google_trends',     -- Rising topics
    'reddit',            -- Reddit questions
    'gsc'                -- Google Search Console actual queries
  )),
  estimated_volume  int,       -- search/query volume if available
  trend_score       float,     -- 0-1, how fast this is growing
  already_tracked   boolean default false,  -- added to keywords table?
  discovered_at     timestamptz default now()
);

create index if not exists discovered_prompts_user on discovered_prompts(user_id, estimated_volume desc);
create unique index if not exists discovered_prompts_unique on discovered_prompts(user_id, phrase, source);

-- Google Search Console connections
create table if not exists gsc_connections (
  id               uuid primary key default gen_random_uuid(),
  user_id          text not null unique,
  site_url         text not null,        -- e.g. "https://acmecorp.com/"
  access_token     text,                 -- encrypted OAuth token
  refresh_token    text,
  token_expiry     timestamptz,
  connected_at     timestamptz default now()
);

-- GSC query data — actual queries driving traffic to customer sites
create table if not exists gsc_queries (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  query        text not null,
  clicks       int default 0,
  impressions  int default 0,
  position     float,
  date_range   text,   -- e.g. "last_28_days"
  synced_at    timestamptz default now()
);

create index if not exists gsc_queries_user on gsc_queries(user_id, impressions desc);

-- RLS
alter table discovered_prompts enable row level security;
alter table gsc_connections enable row level security;
alter table gsc_queries enable row level security;

create policy "discovered_prompts_owner" on discovered_prompts for all using (user_id = auth.uid()::text);
create policy "gsc_connections_owner" on gsc_connections for all using (user_id = auth.uid()::text);
create policy "gsc_queries_owner" on gsc_queries for all using (user_id = auth.uid()::text);
