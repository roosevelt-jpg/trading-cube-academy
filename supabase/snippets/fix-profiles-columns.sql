-- Run AFTER migrations 001–003 if profiles table predates this schema.
-- Adds columns the app expects for dashboards and admin views.

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists avatar_initials text;
alter table public.profiles add column if not exists last_active_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Backfill from auth.users where emails are missing on profiles
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

update public.profiles
set avatar_initials = upper(left(coalesce(full_name, 'U'), 1) || left(split_part(coalesce(full_name, 'User'), ' ', 2), 1))
where avatar_initials is null;

update public.profiles set status = 'active' where status is null;
