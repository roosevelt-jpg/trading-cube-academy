-- Run on Supabase SQL Editor AFTER 001_schema.sql and 002_cms_images.sql
-- Adds integration secret storage + quiz timer columns

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

-- Ensure all integration providers exist
insert into public.integration_settings (provider, label, enabled, public_value) values
('stripe', 'Stripe Payments', false, '{"publishable_key":""}'::jsonb),
('openai', 'OpenAI (optional)', false, '{"model":"gpt-4o-mini"}'::jsonb)
on conflict (provider) do nothing;

-- Default 30-minute timer on Module 3 quiz (when LMS tables exist)
update public.module_quiz_settings
set time_limit_seconds = 1800
where module_id = 'a0030001-0000-4000-8000-000000000003' and time_limit_seconds is null;

-- Quiz proctoring (004_quiz_proctoring.sql)
alter table public.module_quiz_settings
  add column if not exists proctoring_required boolean not null default true;

alter table public.quiz_attempts
  add column if not exists proctoring_consented_at timestamptz,
  add column if not exists proctoring_status text default 'none';

create table if not exists public.quiz_proctoring_recordings (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  blob_pathname text,
  blob_url text,
  mime_type text default 'video/webm',
  duration_seconds int,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);

create index if not exists quiz_proctoring_attempt_idx
  on public.quiz_proctoring_recordings (attempt_id, created_at desc);

alter table public.quiz_proctoring_recordings enable row level security;

drop policy if exists "students read own proctoring" on public.quiz_proctoring_recordings;
create policy "students read own proctoring" on public.quiz_proctoring_recordings
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "students insert own proctoring" on public.quiz_proctoring_recordings;
create policy "students insert own proctoring" on public.quiz_proctoring_recordings
  for insert with check (auth.uid() = user_id);

drop policy if exists "admin manage proctoring" on public.quiz_proctoring_recordings;
create policy "admin manage proctoring" on public.quiz_proctoring_recordings
  for all using (public.is_admin()) with check (public.is_admin());

do $$
begin
  alter publication supabase_realtime add table public.quiz_proctoring_recordings;
exception when duplicate_object then null;
end $$;

-- 005_student_progress_certificates.sql
alter table public.certificates
  add column if not exists final_score int;

drop policy if exists "students insert own activity" on public.activity_events;
create policy "students insert own activity"
  on public.activity_events for insert
  with check (
    (meta->>'user_id')::uuid = auth.uid()
    or public.is_admin()
  );

-- 006_activity_select_policy.sql
drop policy if exists "students read activity" on public.activity_events;
drop policy if exists "students read own activity" on public.activity_events;
create policy "students read own activity"
  on public.activity_events for select
  using (
    (meta->>'user_id')::uuid = auth.uid()
    or public.is_admin()
  );
