-- ============================================================
-- TRACQUE — Continuous scanning (fix the fake cron)
--
-- The old `daily-scan-trigger` inserted empty scan_jobs (it created no
-- scan_tasks), and the dispatcher fanned out to workers that aren't deployed,
-- so NOTHING actually scanned on a schedule. This repoints the daily cron at
-- the `scheduled-scan` edge function, which runs the proven multi-engine
-- `run-scan` for every active account (≥1 brand AND ≥1 keyword), time-bounded.
--
-- Two secrets are set OUT OF BAND (never committed):
--   • function env  CRON_SECRET           (supabase secrets set CRON_SECRET=…)
--   • Vault secret  'cron_secret' (= same) (select vault.create_secret(…))
-- The cron reads the Vault secret and passes it as the x-cron-secret header;
-- scheduled-scan rejects any call without it (it triggers paid API usage).
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- cron.schedule upserts by name, replacing the broken empty-job trigger.
select cron.schedule('daily-scan-trigger', '0 6 * * *', $$
  select net.http_post(
    url := 'https://poarbxoeswwxexwnrugp.supabase.co/functions/v1/scheduled-scan',
    headers := jsonb_build_object(
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
$$);
