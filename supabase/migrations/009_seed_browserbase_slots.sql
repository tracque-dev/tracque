-- ============================================================
-- TRACQUE — Seed Browserbase concurrency slots
--
-- With Browserbase-managed residential proxies, each session gets a
-- FRESH IP, so a scrape_proxies row isn't a fixed IP — it's a
-- concurrency token. claim_proxy() hands out one per in-flight scrape,
-- so the number of rows = max parallel scrapes per geo.
--
-- Set this to match your Browserbase plan's concurrency limit.
-- Hobby ≈ 1–3, Scale plans go much higher. Add more rows to scale up:
--   insert into scrape_proxies(label, provider, geo)
--   select 'bb-us-' || g, 'browserbase', 'us' from generate_series(6, 25) g;
-- ============================================================

insert into scrape_proxies (label, provider, geo, proxy_url)
select 'bb-us-' || g, 'browserbase', 'us', null
from generate_series(1, 5) g
where not exists (select 1 from scrape_proxies where provider = 'browserbase' and geo = 'us');
