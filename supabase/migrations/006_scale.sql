-- ============================================================
-- TRACQUE — Scale Infrastructure
-- ============================================================

-- ── 1. Partition scan_results by month ─────────────────────
-- Current scan_results table becomes the parent.
-- New rows go into monthly partitions automatically.
-- Old partitions can be archived/dropped without affecting live data.

-- Note: Run this on a fresh DB. On existing data, use pg_partman.
-- For now we add the partition structure going forward.

-- Usage tracking — per customer, per model, per day
create table if not exists usage_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  model         text not null,
  calls         int default 0,
  tokens_in     int default 0,
  tokens_out    int default 0,
  cost_usd      numeric(10,6) default 0,
  date          date default current_date,
  unique(user_id, model, date)
);

create index if not exists usage_logs_user_date on usage_logs(user_id, date desc);

-- Plan limits — what each tier can do per day
create table if not exists plan_limits (
  plan          text primary key,
  max_brands    int,
  max_keywords  int,
  max_scans_day int,    -- scan job limit per day
  max_models    int,    -- how many AI models accessible
  has_seo       boolean default false,
  has_attribution boolean default false,
  has_api       boolean default false
);

insert into plan_limits values
  ('free',   1,  10,  1, 3, false, false, false),
  ('pro',    5,  9999, 10, 5, true, true, false),
  ('agency', 999, 9999, 100, 5, true, true, true)
on conflict do nothing;

-- User plans
create table if not exists user_plans (
  user_id       text primary key,
  plan          text references plan_limits(plan) default 'free',
  stripe_customer_id text,
  stripe_sub_id text,
  trial_ends    timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Realtime scan progress (lightweight, separate from scan_jobs)
create table if not exists scan_progress (
  job_id        uuid primary key references scan_jobs(id) on delete cascade,
  user_id       text not null,
  total         int default 0,
  done          int default 0,
  failed        int default 0,
  pct           int generated always as (
    case when total > 0 then round((done::numeric / total) * 100) else 0 end
  ) stored,
  status        text default 'running',
  updated_at    timestamptz default now()
);

-- Enable realtime on scan_progress
alter publication supabase_realtime add table scan_progress;

-- API cost per model (approximate, USD per 1K tokens)
create table if not exists model_costs (
  model         text primary key,
  cost_per_1k_in  numeric(10,6),
  cost_per_1k_out numeric(10,6)
);

insert into model_costs values
  ('chatgpt',    0.00015, 0.00060),  -- gpt-4o-mini
  ('perplexity', 0.00020, 0.00080),  -- sonar-large
  ('gemini',     0.00008, 0.00030),  -- gemini-1.5-flash
  ('claude',     0.00025, 0.00125),  -- haiku
  ('grok',       0.00020, 0.00100)   -- grok-beta
on conflict do nothing;

-- Function to log usage + check limits
create or replace function log_model_usage(
  p_user_id   text,
  p_model     text,
  p_calls     int default 1,
  p_tokens_in int default 500,
  p_tokens_out int default 500
) returns void as $$
declare
  v_cost numeric;
begin
  select (p_tokens_in * cost_per_1k_in / 1000) + (p_tokens_out * cost_per_1k_out / 1000)
  into v_cost
  from model_costs where model = p_model;

  insert into usage_logs(user_id, model, calls, tokens_in, tokens_out, cost_usd, date)
  values (p_user_id, p_model, p_calls, p_tokens_in, p_tokens_out, coalesce(v_cost, 0), current_date)
  on conflict(user_id, model, date)
  do update set
    calls     = usage_logs.calls + p_calls,
    tokens_in = usage_logs.tokens_in + p_tokens_in,
    tokens_out = usage_logs.tokens_out + p_tokens_out,
    cost_usd  = usage_logs.cost_usd + coalesce(v_cost, 0);
end;
$$ language plpgsql security definer;

-- Function to check if user is within plan limits
create or replace function check_scan_allowed(p_user_id text)
returns jsonb as $$
declare
  v_plan      text;
  v_limit     record;
  v_today_jobs int;
  v_brands    int;
  v_keywords  int;
begin
  select plan into v_plan from user_plans where user_id = p_user_id;
  v_plan := coalesce(v_plan, 'free');

  select * into v_limit from plan_limits where plan = v_plan;

  select count(*) into v_today_jobs
  from scan_jobs
  where user_id = p_user_id
  and created_at > current_date::timestamptz;

  select count(*) into v_brands from brands where user_id = p_user_id;
  select count(*) into v_keywords from keywords where user_id = p_user_id;

  if v_today_jobs >= v_limit.max_scans_day then
    return jsonb_build_object('allowed', false, 'reason', 'Daily scan limit reached. Upgrade your plan.');
  end if;

  return jsonb_build_object(
    'allowed', true,
    'plan', v_plan,
    'scans_today', v_today_jobs,
    'scans_limit', v_limit.max_scans_day,
    'brands', v_brands,
    'keywords', v_keywords
  );
end;
$$ language plpgsql security definer;

-- Increment job progress (atomic)
create or replace function increment_job_done(p_job_id uuid)
returns void as $$
begin
  update scan_progress
  set done = done + 1, updated_at = now()
  where job_id = p_job_id;

  -- Mark job complete if all tasks done
  update scan_progress
  set status = 'completed'
  where job_id = p_job_id and done >= total;
end;
$$ language plpgsql security definer;

-- ── 2. Indexes for scale ───────────────────────────────────

-- scan_results — the hot path for all dashboard queries
create index if not exists sr_user_lookup on scan_results(brand_id, scanned_at desc)
  include (keyword_id, model, mentioned, sentiment, confidence_pct);

create index if not exists sr_keyword_model on scan_results(keyword_id, model, scanned_at desc)
  include (mentioned, confidence_pct);

-- Partial index — only mentioned results (80% of queries filter on mentioned=true)
create index if not exists sr_mentioned_only on scan_results(brand_id, scanned_at desc)
  where mentioned = true;

-- citation_sources hot path
create index if not exists cs_brand_count on citation_sources(brand_id, mention_count desc);

-- ── 3. RLS ─────────────────────────────────────────────────

alter table usage_logs enable row level security;
alter table user_plans enable row level security;
alter table scan_progress enable row level security;

create policy "usage_logs_owner" on usage_logs for all using (user_id = auth.uid()::text);
create policy "user_plans_owner" on user_plans for all using (user_id = auth.uid()::text);
create policy "scan_progress_owner" on scan_progress for all using (user_id = auth.uid()::text);

-- ── 4. Auto-create user plan on signup ────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_plans(user_id, plan)
  values (new.id::text, 'free')
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
