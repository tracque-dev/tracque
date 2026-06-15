-- ============================================================
-- TRACQUE — AI Rate-Accuracy Monitor (TRQ-70)
--
-- Credit-union / lender moat: store the institution's ground-truth
-- facts (rates, fees, hours, eligibility), probe AI engines for what
-- they SAY about the brand, and diff. A wrong APR stated by ChatGPT is
-- reputational AND regulatory (UDAAP / fair-lending) exposure.
--
-- Client-scoped via the brand. Never auto-publishes a rate; this is
-- monitoring only (keeps it out of model-risk / decisioning scope).
-- ============================================================

create table if not exists rate_facts (
  id             uuid primary key default gen_random_uuid(),
  brand_id       uuid references brands(id) on delete cascade,
  label          text not null,            -- e.g. "12-month CD APY"
  value          text not null,            -- e.g. "4.50%"
  category       text default 'rate',      -- rate | fee | hours | eligibility | other
  effective_date date,
  updated_at     timestamptz default now(),
  created_at     timestamptz default now()
);
create index if not exists rate_facts_brand on rate_facts(brand_id);

create table if not exists rate_checks (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  fact_id     uuid references rate_facts(id) on delete cascade,
  engine      text default 'chatgpt',
  ai_value    text,                         -- what the engine stated
  status      text,                         -- accurate | wrong | not_stated
  excerpt     text,
  scanned_at  timestamptz default now()
);
create index if not exists rate_checks_brand on rate_checks(brand_id, scanned_at desc);

create view rate_facts_scoped with (security_invoker = true) as
select rf.*, b.user_id, b.client_id from rate_facts rf join brands b on b.id = rf.brand_id;

-- Latest check per fact, joined to the ground truth for an at-a-glance diff.
create view rate_checks_scoped with (security_invoker = true) as
select distinct on (rc.fact_id, rc.engine)
  rc.*, b.user_id, b.client_id, rf.label, rf.value as truth, rf.category
from rate_checks rc
join brands b on b.id = rc.brand_id
left join rate_facts rf on rf.id = rc.fact_id
order by rc.fact_id, rc.engine, rc.scanned_at desc;

alter table rate_facts  enable row level security;
alter table rate_checks enable row level security;
create policy "rate_facts_owner" on rate_facts for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
create policy "rate_checks_owner" on rate_checks for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
