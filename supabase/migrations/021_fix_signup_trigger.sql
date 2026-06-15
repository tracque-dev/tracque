-- ============================================================
-- TRACQUE — Fix broken signup (critical)
--
-- The on_auth_user_created trigger inserted into user_plans; if that
-- insert threw (RLS/permission/constraint), it failed the WHOLE signup
-- ("Database error creating new user"). An auth trigger must never be
-- able to block account creation. Wrap it so signup always succeeds;
-- a missing plan row is harmless (app treats absence as 'free').
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  begin
    insert into user_plans(user_id, plan)
    values (new.id::text, 'free')
    on conflict (user_id) do nothing;
  exception when others then
    -- never block signup on plan-row creation
    null;
  end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Make sure the trigger owner can actually write the row (belt + braces).
grant insert on table user_plans to postgres, service_role;
