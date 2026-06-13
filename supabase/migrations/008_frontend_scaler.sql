-- ============================================================
-- TRACQUE — Frontend Scaler Rails
-- Managed-browser, logged-out, proxy-rotated scraping at scale.
--
-- Architecture:
--   scan_tasks (source='frontend')  →  QStash  →  scrape-task fn
--      claim_proxy()  →  Browserbase session  →  scraper adapter
--      →  scan_results (source='frontend')  →  release_proxy()
--
-- The rotating unit in logged-out mode is a PROXY + ephemeral
-- browser fingerprint. scrape_identities is scaffolding for the
-- future authenticated-account tier (login-gated surfaces).
-- ============================================================

-- ── Result + task provenance ───────────────────────────────
-- Where did this data come from: our API proxy, or a real frontend?
alter table scan_results add column if not exists source   text default 'api'
  check (source in ('api', 'frontend'));
alter table scan_results add column if not exists provider text;  -- e.g. 'browserbase', 'openai'

alter table scan_tasks   add column if not exists source   text default 'api'
  check (source in ('api', 'frontend'));
alter table scan_tasks   add column if not exists proxy_id    uuid;
alter table scan_tasks   add column if not exists identity_id uuid;

create index if not exists scan_tasks_frontend_pending
  on scan_tasks(status, created_at) where status = 'pending' and source = 'frontend';

-- ── Proxy pool ─────────────────────────────────────────────
-- Residential / mobile proxies. The unit we rotate in logged-out mode.
create table if not exists scrape_proxies (
  id              uuid primary key default gen_random_uuid(),
  label           text,
  provider        text not null,                 -- brightdata | oxylabs | smartproxy | iproyal | browserbase
  geo             text default 'us',             -- country / region for geo-targeted answers
  -- Browserbase can manage proxies for us; when self-supplying, store the URL (encrypted at rest)
  proxy_url       text,                           -- http(s)://user:pass@host:port  (null = provider-managed)
  status          text default 'active'
                  check (status in ('active', 'cooldown', 'flagged', 'banned', 'disabled')),
  in_use          boolean default false,
  fail_count      int default 0,
  success_count   int default 0,
  cooldown_until  timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz default now()
);

create index if not exists scrape_proxies_claimable
  on scrape_proxies(geo, last_used_at)
  where status = 'active' and in_use = false;

-- ── Identities (future authenticated tier) ─────────────────
-- Logged-out scraping leaves session_state null. Populated only
-- for login-gated surfaces (Claude) or personalized-experience runs.
create table if not exists scrape_identities (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null,                  -- chatgpt | perplexity | gemini | claude | copilot
  label           text,
  proxy_id        uuid references scrape_proxies(id),
  fingerprint     jsonb default '{}'::jsonb,      -- stable UA / viewport / timezone / locale
  session_state   jsonb,                          -- cookies/localStorage; null = logged-out
  credentials_enc text,                           -- encrypted; null = logged-out
  status          text default 'active'
                  check (status in ('warming', 'active', 'cooldown', 'flagged', 'banned', 'disabled')),
  in_use          boolean default false,
  fail_count      int default 0,
  cooldown_until  timestamptz,
  last_used_at    timestamptz,
  created_at      timestamptz default now()
);

create index if not exists scrape_identities_claimable
  on scrape_identities(platform, last_used_at)
  where status = 'active' and in_use = false;

-- ── Session log (observability) ────────────────────────────
-- One row per browser session run. Powers health monitoring,
-- ban-rate dashboards, and cost tracking.
create table if not exists scrape_sessions (
  id                uuid primary key default gen_random_uuid(),
  task_id           uuid references scan_tasks(id) on delete set null,
  platform          text not null,
  provider          text not null default 'browserbase',
  provider_session  text,                          -- Browserbase session id
  proxy_id          uuid references scrape_proxies(id),
  identity_id       uuid references scrape_identities(id),
  geo               text,
  status            text default 'running'
                    check (status in ('running', 'completed', 'failed', 'captcha', 'banned', 'timeout')),
  captcha_hit       boolean default false,
  duration_ms       int,
  error             text,
  created_at        timestamptz default now(),
  completed_at      timestamptz
);

create index if not exists scrape_sessions_recent on scrape_sessions(platform, created_at desc);

-- ── Claim / release: atomic, contention-safe ───────────────
-- Picks the healthiest least-recently-used proxy and locks it.
-- FOR UPDATE SKIP LOCKED → thousands of workers never collide.
create or replace function claim_proxy(p_geo text default 'us')
returns uuid as $$
declare v_id uuid;
begin
  -- Auto-recover proxies whose cooldown has elapsed
  update scrape_proxies
    set status = 'active', cooldown_until = null
    where status = 'cooldown' and cooldown_until < now();

  select id into v_id
  from scrape_proxies
  where status = 'active' and in_use = false
    and (p_geo is null or geo = p_geo)
  order by last_used_at asc nulls first
  for update skip locked
  limit 1;

  if v_id is not null then
    update scrape_proxies
      set in_use = true, last_used_at = now()
      where id = v_id;
  end if;

  return v_id;  -- null = pool exhausted; caller backs off / requeues
end;
$$ language plpgsql;

-- Return a proxy to the pool. On failure, apply a cooldown; after
-- repeated failures, flag it for review.
create or replace function release_proxy(
  p_id              uuid,
  p_success         boolean,
  p_cooldown_secs   int default 90
) returns void as $$
begin
  if p_success then
    update scrape_proxies
      set in_use = false,
          success_count = success_count + 1,
          fail_count = 0,
          status = 'active',
          last_used_at = now()
      where id = p_id;
  else
    update scrape_proxies
      set in_use = false,
          fail_count = fail_count + 1,
          last_used_at = now(),
          status = case when fail_count + 1 >= 5 then 'flagged' else 'cooldown' end,
          cooldown_until = now() + make_interval(secs => p_cooldown_secs)
      where id = p_id;
  end if;
end;
$$ language plpgsql;

-- ── RLS ────────────────────────────────────────────────────
-- These are operational/infra tables — service-role only, no
-- end-user access. RLS on with no policies = deny all to anon/auth.
alter table scrape_proxies    enable row level security;
alter table scrape_identities enable row level security;
alter table scrape_sessions   enable row level security;

-- ── Job builder with source + model selection ──────────────
-- Generalized create_scan_job: choose which models to run and whether
-- each task hits the API path or the frontend scaler. Defaults preserve
-- the original behavior (all 5 models, API source).
create or replace function create_scan_job_src(
  p_user_id    text,
  p_runs       int default 3,
  p_brand_ids  uuid[] default null,
  p_kw_ids     uuid[] default null,
  p_models     text[] default array['chatgpt','perplexity','gemini','claude','grok'],
  p_source     text default 'api'
) returns uuid as $$
declare
  v_job_id  uuid;
  v_brand   record;
  v_kw      record;
  v_model   text;
  v_count   int := 0;
begin
  insert into scan_jobs(user_id, runs_per_kw) values (p_user_id, p_runs) returning id into v_job_id;

  for v_kw in (
    select id from keywords
    where user_id = p_user_id and (p_kw_ids is null or id = any(p_kw_ids))
  ) loop
    for v_brand in (
      select id from brands
      where user_id = p_user_id and (p_brand_ids is null or id = any(p_brand_ids))
    ) loop
      foreach v_model in array p_models loop
        insert into scan_tasks(job_id, keyword_id, brand_id, model, source)
        values (v_job_id, v_kw.id, v_brand.id, v_model, p_source);
        v_count := v_count + 1;
      end loop;
    end loop;
  end loop;

  update scan_jobs set total_tasks = v_count where id = v_job_id;
  return v_job_id;
end;
$$ language plpgsql security definer;

-- ── Health view for the ops dashboard ──────────────────────
create or replace view scraper_health as
select
  platform,
  count(*)                                                   as runs_24h,
  count(*) filter (where status = 'completed')               as ok,
  count(*) filter (where status in ('failed','timeout'))     as failed,
  count(*) filter (where status = 'captcha')                 as captcha,
  count(*) filter (where status = 'banned')                  as banned,
  round(avg(duration_ms))                                    as avg_ms,
  round(100.0 * count(*) filter (where status = 'completed')
        / nullif(count(*), 0), 1)                            as success_pct
from scrape_sessions
where created_at > now() - interval '24 hours'
group by platform;
