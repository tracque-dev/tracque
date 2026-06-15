-- ============================================================
-- TRACQUE — Share-of-AI-Voice (SAIV) grid
--
-- Sample AI answers across a set of prompts; for each, record whether
-- the brand is recommended, at what rank, and which competitors appear
-- instead. SAIV = share of prompts where the brand is recommended.
-- Client-scoped via the brand.
-- ============================================================

create table if not exists saiv_results (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references brands(id) on delete cascade,
  engine       text not null default 'chatgpt',
  prompt       text not null,
  mentioned    boolean default false,
  position     int,                       -- rank among recommended brands (1 = first)
  competitors  jsonb,                     -- other brands recommended in the answer
  excerpt      text,
  scanned_at   timestamptz default now()
);
create index if not exists saiv_brand on saiv_results(brand_id, scanned_at desc);

create view saiv_results_scoped with (security_invoker = true) as
select sr.*, b.user_id, b.client_id, b.name as brand_name
from saiv_results sr join brands b on b.id = sr.brand_id;

alter table saiv_results enable row level security;
create policy "saiv_owner" on saiv_results for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
