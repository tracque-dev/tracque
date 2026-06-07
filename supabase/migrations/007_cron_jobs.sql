-- ============================================================
-- TRACQUE — Cron Jobs
-- Requires pg_cron extension (enabled by default on Supabase)
-- ============================================================

-- Enable pg_cron
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Process scan queue every minute
select cron.schedule(
  'process-scan-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://poarbxoeswwxexwnrugp.supabase.co/functions/v1/queue-dispatcher',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Daily scan trigger at 6am UTC for all users
select cron.schedule(
  'daily-scan-trigger',
  '0 6 * * *',
  $$
  -- Create scan jobs for all active users
  insert into scan_jobs(user_id, runs_per_kw)
  select distinct user_id, 3
  from brands
  where user_id in (
    select user_id from user_plans where plan in ('pro', 'agency')
  );
  $$
);

-- Weekly recommendations refresh every Monday 7am UTC
select cron.schedule(
  'weekly-recommendations',
  '0 7 * * 1',
  $$
  -- Trigger recommendation generation for pro/agency users
  -- (handled by queue-dispatcher picking up pending recommendation_jobs)
  select 1; -- placeholder — recommendations triggered via app
  $$
);

-- Clean up old scan_results > 90 days (keep storage lean)
select cron.schedule(
  'archive-old-scans',
  '0 2 * * 0',
  $$
  delete from scan_results
  where scanned_at < now() - interval '90 days';
  $$
);

-- Clean up completed scan_tasks > 7 days
select cron.schedule(
  'cleanup-scan-tasks',
  '0 3 * * *',
  $$
  delete from scan_tasks
  where status in ('completed', 'failed')
  and created_at < now() - interval '7 days';
  $$
);
