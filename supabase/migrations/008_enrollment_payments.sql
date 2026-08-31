-- Course Stripe prices + payment session tracking

alter table public.courses add column if not exists stripe_price_id text;

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  stripe_session_id text unique not null,
  stripe_price_id text,
  course_id uuid references public.courses(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.payment_sessions enable row level security;

drop policy if exists "admin manage payment_sessions" on public.payment_sessions;
create policy "admin manage payment_sessions" on public.payment_sessions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users read own payment_sessions" on public.payment_sessions;
create policy "users read own payment_sessions" on public.payment_sessions
  for select using (auth.uid() = user_id or public.is_admin());
