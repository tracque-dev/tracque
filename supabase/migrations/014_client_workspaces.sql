-- ============================================================
-- TRACQUE — Client Workspaces (agency model)
--
-- One account (the agency) → many clients. Brands, keywords, and all
-- downstream scans/SEO data are grouped under a client. client_id is
-- nullable so existing rows keep working ("Unassigned").
--
-- seo_cache enables cross-client dedupe: scan a keyword/domain once,
-- serve it to every client tracking it (the big cost lever at scale).
-- ============================================================

create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,              -- agency owner
  name        text not null,
  domain      text,                       -- client's primary site
  color       text default '#3B82F6',     -- chip color in the switcher
  archived    boolean default false,
  created_at  timestamptz default now()
);
create index if not exists clients_user on clients(user_id, archived);

-- Group existing entities under a client.
alter table brands   add column if not exists client_id uuid references clients(id) on delete set null;
alter table keywords add column if not exists client_id uuid references clients(id) on delete set null;
create index if not exists brands_client   on brands(client_id);
create index if not exists keywords_client on keywords(client_id);

-- ── Cross-client SEO cache ─────────────────────────────────
-- key = e.g. 'serp:us:best crm', 'domain_overview:acme.com'.
-- Workers check here before paying DataForSEO; one fetch serves all.
create table if not exists seo_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  fetched_at  timestamptz default now(),
  expires_at  timestamptz not null
);
create index if not exists seo_cache_expiry on seo_cache(expires_at);

-- Helper: read a cache row only if still fresh.
create or replace function seo_cache_get(p_key text)
returns jsonb as $$
  select payload from seo_cache where cache_key = p_key and expires_at > now();
$$ language sql stable;

-- Helper: upsert with TTL.
create or replace function seo_cache_put(p_key text, p_payload jsonb, p_ttl_secs int default 86400)
returns void as $$
  insert into seo_cache(cache_key, payload, fetched_at, expires_at)
  values (p_key, p_payload, now(), now() + make_interval(secs => p_ttl_secs))
  on conflict (cache_key) do update set
    payload = excluded.payload, fetched_at = now(), expires_at = excluded.expires_at;
$$ language sql;

-- ── RLS ────────────────────────────────────────────────────
alter table clients enable row level security;
create policy "clients_owner" on clients for all using (user_id = auth.uid()::text);
-- seo_cache is shared infra (service-role only) → RLS on, no policies.
alter table seo_cache enable row level security;
