-- ============================================================
-- TRACQUE — Harden client_id ownership on INSERT (TRQ-12 review fix)
--
-- Adversarial review found: RLS validated the row's user_id but NEVER
-- tied the supplied client_id to a client OWNED by that user. The FK
-- `references clients(id)` only checks EXISTENCE (FK checks bypass RLS),
-- so an authenticated tenant A could POST a row carrying tenant B's
-- client_id (user_id still A's own, so WITH CHECK passed).
--
-- Consequences closed here:
--   • HIGH — client_reports token-squatting DoS: A pre-creates the single
--     allowed share-link row for B's client_id → B can never generate one
--     (unique index collision). Fixed by (a) ownership-tied WITH CHECK and
--     (b) moving uniqueness to (user_id, client_id) so a non-owner row can
--     never occupy a victim's slot.
--   • LOW — SEO report pollution: A inserts a brand carrying B's client_id;
--     its seo_results flow into B's client_id-scoped public report. Fixed by
--     ownership-tying client_id on brands/keywords inserts.
--
-- Pattern: WITH CHECK requires client_id to be NULL (unassigned, allowed)
-- OR reference a clients row owned by auth.uid(). Existing app insert paths
-- always use the selected (owned) client or null, so nothing legitimate breaks.
-- ============================================================

-- ── client_reports: ownership tie + per-(user,client) uniqueness ──
drop policy if exists "client_reports_owner" on client_reports;
create policy "client_reports_owner" on client_reports for all
  using (user_id = auth.uid()::text)
  with check (
    user_id = auth.uid()::text
    and exists (select 1 from clients c where c.id = client_id and c.user_id = auth.uid()::text)
  );

drop index if exists client_reports_client;
create unique index if not exists client_reports_user_client on client_reports(user_id, client_id);

-- ── brands: validate client_id ownership on write ──
drop policy if exists "brands_owner" on brands;
create policy "brands_owner" on brands for all
  using (user_id = auth.uid()::text)
  with check (
    user_id = auth.uid()::text
    and (client_id is null or exists (select 1 from clients c where c.id = client_id and c.user_id = auth.uid()::text))
  );

-- ── keywords: same ──
drop policy if exists "keywords_owner" on keywords;
create policy "keywords_owner" on keywords for all
  using (user_id = auth.uid()::text)
  with check (
    user_id = auth.uid()::text
    and (client_id is null or exists (select 1 from clients c where c.id = client_id and c.user_id = auth.uid()::text))
  );
