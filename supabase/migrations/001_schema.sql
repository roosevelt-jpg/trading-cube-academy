-- Trading Cube Academy — production schema
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student' check (role in ('admin', 'student')),
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  avatar_initials text,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.page_contents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  eyebrow text,
  description text,
  sections jsonb not null default '[]'::jsonb,
  primary_cta_label text,
  primary_cta_href text,
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  tier text not null default 'foundation' check (tier in ('foundation', 'core', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'live')),
  module_count int not null default 0,
  lesson_count int not null default 0,
  enrolled_count int not null default 0,
  sort_order int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order int not null default 0,
  lesson_count int not null default 0,
  unlock_after_module_id uuid references public.modules(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  title text not null,
  lesson_type text not null check (lesson_type in ('video', 'reading', 'quiz')),
  content jsonb not null default '{}'::jsonb,
  youtube_video_id text,
  duration_label text,
  duration_seconds int,
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, slug)
);

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_id text not null,
  course_name text,
  duration_label text,
  visibility text not null default 'marketing' check (visibility in ('marketing', 'course', 'preview')),
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  accent text,
  sort_order int not null default 0
);

create table if not exists public.marketing_pillars (
  id uuid primary key default gen_random_uuid(),
  number_label text not null,
  title text not null,
  body text not null,
  sort_order int not null default 0
);

create table if not exists public.marketing_steps (
  id uuid primary key default gen_random_uuid(),
  number_label text not null,
  title text not null,
  body text not null,
  sort_order int not null default 0
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_meta text not null,
  sort_order int not null default 0
);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0
);

create table if not exists public.module_quiz_settings (
  module_id uuid primary key references public.modules(id) on delete cascade,
  passing_score int not null default 70,
  attempts_allowed int not null default 3,
  question_order text not null default 'sequential'
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  question text not null,
  sort_order int not null default 0
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  progress_pct int not null default 0,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  progress_pct int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  completed boolean not null default false,
  progress_pct int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  score int not null,
  passed boolean not null,
  attempt_number int not null default 1,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  certificate_code text unique not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  student_name text,
  subject text not null,
  message text not null,
  channel text not null default 'email',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  title text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  material_type text not null default 'document',
  blob_pathname text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_initials, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 1) ||
      left(split_part(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), ' ', 2), 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger site_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
create trigger courses_updated before update on public.courses for each row execute function public.set_updated_at();
create trigger modules_updated before update on public.modules for each row execute function public.set_updated_at();
create trigger lessons_updated before update on public.lessons for each row execute function public.set_updated_at();
create trigger support_tickets_updated before update on public.support_tickets for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.page_contents enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.youtube_videos enable row level security;
alter table public.marketing_stats enable row level security;
alter table public.marketing_pillars enable row level security;
alter table public.marketing_steps enable row level security;
alter table public.testimonials enable row level security;
alter table public.faq_items enable row level security;
alter table public.module_quiz_settings enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.module_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.support_tickets enable row level security;
alter table public.access_requests enable row level security;
alter table public.activity_events enable row level security;
alter table public.course_materials enable row level security;

-- Public marketing reads
create policy "public read site_settings" on public.site_settings for select using (true);
create policy "public read page_contents" on public.page_contents for select using (true);
create policy "public read published courses" on public.courses for select using (published = true or public.is_admin());
create policy "public read published modules" on public.modules for select using (published = true or public.is_admin());
create policy "public read published lessons" on public.lessons for select using (published = true or auth.uid() is not null or public.is_admin());
create policy "public read marketing videos" on public.youtube_videos for select using ((published = true and visibility = 'marketing') or auth.uid() is not null or public.is_admin());
create policy "public read marketing content" on public.marketing_stats for select using (true);
create policy "public read marketing pillars" on public.marketing_pillars for select using (true);
create policy "public read marketing steps" on public.marketing_steps for select using (true);
create policy "public read testimonials" on public.testimonials for select using (true);
create policy "public read faq" on public.faq_items for select using (true);
create policy "public insert access_requests" on public.access_requests for insert with check (true);
create policy "admin read access_requests" on public.access_requests for select using (public.is_admin());
create policy "admin update access_requests" on public.access_requests for update using (public.is_admin());

-- Profiles
create policy "profiles read own or admin" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles update own or admin" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "admin insert profiles" on public.profiles for insert with check (public.is_admin());

-- Admin write all CMS tables
create policy "admin manage site_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage page_contents" on public.page_contents for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage modules" on public.modules for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage lessons" on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage youtube_videos" on public.youtube_videos for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage marketing_stats" on public.marketing_stats for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage marketing_pillars" on public.marketing_pillars for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage marketing_steps" on public.marketing_steps for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage faq" on public.faq_items for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage quiz settings" on public.module_quiz_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage quiz questions" on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage quiz options" on public.quiz_options for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage activity" on public.activity_events for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage materials" on public.course_materials for all using (public.is_admin()) with check (public.is_admin());

-- Student reads
create policy "students read quiz content" on public.module_quiz_settings for select using (auth.uid() is not null);
create policy "students read quiz questions" on public.quiz_questions for select using (auth.uid() is not null);
create policy "students read quiz options" on public.quiz_options for select using (auth.uid() is not null);
create policy "students read own enrollments" on public.enrollments for select using (auth.uid() = user_id or public.is_admin());
create policy "students read own lesson progress" on public.lesson_progress for select using (auth.uid() = user_id or public.is_admin());
create policy "students write own lesson progress" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "students read own module progress" on public.module_progress for select using (auth.uid() = user_id or public.is_admin());
create policy "students write own module progress" on public.module_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "students read own quiz attempts" on public.quiz_attempts for select using (auth.uid() = user_id or public.is_admin());
create policy "students write own quiz attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);
create policy "students read own certificates" on public.certificates for select using (auth.uid() = user_id or public.is_admin());
create policy "students read own tickets" on public.support_tickets for select using (auth.uid() = user_id or public.is_admin());
create policy "students create tickets" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "admin manage tickets" on public.support_tickets for update using (public.is_admin());
create policy "admin manage enrollments" on public.enrollments for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage certificates" on public.certificates for all using (public.is_admin()) with check (public.is_admin());
create policy "students read activity" on public.activity_events for select using (auth.uid() is not null);

-- Realtime (idempotent — safe to re-run if tables are already published)
do $$ begin alter publication supabase_realtime add table public.site_settings; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.page_contents; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.courses; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.modules; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.lessons; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.youtube_videos; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.marketing_stats; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.marketing_pillars; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.marketing_steps; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.testimonials; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.faq_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.enrollments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.lesson_progress; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.module_progress; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.quiz_attempts; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.support_tickets; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.activity_events; exception when duplicate_object then null; end $$;
