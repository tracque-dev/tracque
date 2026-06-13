-- ============================================================
-- TRACQUE — Premium repricing: $0 / $249 / $599 / $1499
--
-- Repositioned upmarket. No longer "undercut Profound" — now a
-- premium platform justified by the only revenue-attribution loop
-- in the category. Limits unchanged; price_cents bumped.
-- ============================================================

update plan_limits set price_cents =  24900 where plan = 'starter';
update plan_limits set price_cents =  59900 where plan = 'pro';
update plan_limits set price_cents = 149900 where plan = 'agency';
update plan_limits set price_cents =      0 where plan = 'free';
