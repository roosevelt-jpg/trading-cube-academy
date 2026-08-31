-- Quiz proctoring (webcam monitoring during exams)

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
