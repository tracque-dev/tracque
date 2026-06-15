-- ============================================================
-- TRACQUE — Geo-grid Share-of-AI-Voice (TRQ-23)
-- Local "near me" AI visibility varies block-to-block. Sample a 3x3
-- grid of points around a center; per cell, is the brand recommended?
-- Client-scoped via the brand. Cost guard: ≤9 cells per scan.
-- ============================================================

create table if not exists saiv_grid (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid references brands(id) on delete cascade,
  label       text,                 -- locality name for the cell
  lat         numeric,
  lng         numeric,
  mentioned   boolean default false,
  position    int,
  created_at  timestamptz default now()
);
create index if not exists saiv_grid_brand on saiv_grid(brand_id, created_at desc);

create view saiv_grid_scoped with (security_invoker = true) as
select sg.*, b.user_id, b.client_id from saiv_grid sg join brands b on b.id = sg.brand_id;

alter table saiv_grid enable row level security;
create policy "saiv_grid_owner" on saiv_grid for all using (
  exists (select 1 from brands b where b.id = brand_id and b.user_id = auth.uid()::text));
