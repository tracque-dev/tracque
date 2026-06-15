-- ============================================================
-- TRACQUE — Keyword Explorer (TRQ-34, DataForSEO Labs)
-- Seed keyword → hundreds of ideas with volume/difficulty/CPC/intent.
-- Client-scoped (research belongs to the workspace, not a single brand).
-- ============================================================

create table if not exists keyword_ideas (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  client_id     uuid references clients(id) on delete cascade,
  seed          text,
  keyword       text,
  search_volume int,
  difficulty    int,
  cpc           numeric,
  intent        text,
  created_at    timestamptz default now()
);
create index if not exists keyword_ideas_scope on keyword_ideas(user_id, client_id, search_volume desc);

alter table keyword_ideas enable row level security;
create policy "keyword_ideas_owner" on keyword_ideas for all using (user_id = auth.uid()::text);
