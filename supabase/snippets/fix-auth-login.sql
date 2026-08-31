-- Run in Supabase SQL Editor if login fails with "Invalid login credentials".
-- Creates auth.identities rows required for email/password sign-in.
-- Prefer: node scripts/seed-auth-users.mjs (uses Admin API — most reliable on hosted Supabase)

-- Admin identity
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  'a0000000-0000-4000-8000-000000000001'::uuid,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email = 'admin@thetradingcube.com'
on conflict (id) do nothing;

-- Student identity
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select
  'a0000000-0000-4000-8000-000000000002'::uuid,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(), now(), now()
from auth.users u
where u.email = 'm.harrison@email.com'
on conflict (id) do nothing;

-- Reset passwords (bcrypt) if users exist but password never worked
update auth.users
set encrypted_password = crypt('TradingCube2026!', gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email in ('admin@thetradingcube.com', 'm.harrison@email.com');
