-- Integration API keys + quiz timer fields

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text unique not null,
  label text not null,
  enabled boolean not null default false,
  public_value jsonb not null default '{}'::jsonb,
  secret_value text,
  updated_at timestamptz not null default now()
);

alter table public.integration_settings add column if not exists secret_value text;

alter table public.module_quiz_settings
  add column if not exists time_limit_seconds int;

alter table public.quiz_attempts
  add column if not exists started_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists timed_out boolean default false;

alter table public.quiz_attempts add column if not exists status text;
update public.quiz_attempts set status = 'completed' where status is null;
alter table public.quiz_attempts alter column status set default 'completed';

create index if not exists quiz_attempts_user_module_idx
  on public.quiz_attempts (user_id, module_id, created_at desc);

alter table public.integration_settings enable row level security;

drop policy if exists "admin manage integrations" on public.integration_settings;
create policy "admin manage integrations" on public.integration_settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin read integration enabled flags" on public.integration_settings;
create policy "authenticated read integration flags" on public.integration_settings
  for select using (auth.uid() is not null);

do $$
begin
  alter publication supabase_realtime add table public.integration_settings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.module_quiz_settings;
exception when duplicate_object then null;
end $$;

create trigger integration_settings_updated
  before update on public.integration_settings
  for each row execute function public.set_updated_at();
