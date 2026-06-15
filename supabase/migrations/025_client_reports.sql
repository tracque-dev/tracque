-- ============================================================
-- TRACQUE — White-label client reports + public share links (TRQ-12)
--
-- An agency hands a client a branded scorecard. Two surfaces:
--   1. In-app (authed): owner reads their own clients' data via the
--      existing client-scoped, RLS-protected hooks.
--   2. Public share link: an opaque token → ONE client's aggregate.
--
-- SECURITY MODEL (the part that must be airtight):
--   • client_reports is owner-only (RLS). Anon CANNOT select it.
--   • The public read path is the `shared-report` edge function ONLY.
--     It runs as service role, resolves token → client_id/user_id
--     SERVER-SIDE, and every downstream aggregate is filtered by that
--     resolved id. The caller never supplies a client_id. A token can
--     therefore only ever surface its own client's data.
--   • Tokens are high-entropy and unguessable; disabling a token
--     (enabled=false) immediately kills the public link.
-- ============================================================

-- Optional per-client branding logo (color/name already on clients).
alter table clients add column if not exists logo_url text;

create table if not exists client_reports (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  user_id     text not null,                       -- agency owner (RLS anchor)
  token       text not null unique,                -- opaque public id (unguessable)
  enabled     boolean not null default true,
  created_at  timestamptz default now()
);
-- One share link per client (get-or-create / rotate in place).
create unique index if not exists client_reports_client on client_reports(client_id);
create index if not exists client_reports_token on client_reports(token);

alter table client_reports enable row level security;
-- Owner-only. No anon/public policy by design — the public path is the
-- service-role edge function, which scopes to a single client per token.
create policy "client_reports_owner" on client_reports for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);
