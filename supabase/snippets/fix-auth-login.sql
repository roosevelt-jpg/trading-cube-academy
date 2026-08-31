-- Run in Supabase SQL Editor if login fails with "Invalid login credentials".
-- Safe to re-run: skips users who already have an email identity.
-- Prefer: node scripts/seed-auth-users.mjs (Admin API — most reliable on hosted Supabase)

-- Create missing auth.identities rows (uses each user's real UUID, not seed placeholders)
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  u.id,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email in ('admin@thetradingcube.com', 'student@thetradingcube.com', 'm.harrison@email.com')
  and not exists (
    select 1
    from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- Ensure profiles exist for auth users (legacy schema-safe)
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', 'User'),
  coalesce(u.raw_user_meta_data->>'role', case when u.email = 'admin@thetradingcube.com' then 'admin' else 'student' end)
from auth.users u
where u.email in ('admin@thetradingcube.com', 'student@thetradingcube.com', 'm.harrison@email.com')
on conflict (id) do update set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  role = coalesce(excluded.role, public.profiles.role);

-- Reset passwords (bcrypt) if users exist but password never worked
update auth.users
set encrypted_password = crypt('TradingCube2026!', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email in ('admin@thetradingcube.com', 'student@thetradingcube.com', 'm.harrison@email.com');
