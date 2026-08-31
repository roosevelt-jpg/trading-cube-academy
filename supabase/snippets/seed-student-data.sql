-- Run this in Supabase SQL Editor when seed.sql failed on student FK rows.
-- Requires: migrations applied, courses seeded, and a student profile (run node scripts/seed-auth-users.mjs first).

-- Student enrollments & progress
insert into public.enrollments (user_id, course_id, progress_pct)
select s.id, v.course_id, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('c0010000-0000-4000-8000-000000000001'::uuid, 100),
  ('c0010000-0000-4000-8000-000000000002'::uuid, 100),
  ('c0010000-0000-4000-8000-000000000003'::uuid, 68),
  ('c0010000-0000-4000-8000-000000000004'::uuid, 32)
) as v(course_id, progress_pct)
where s.id is not null
on conflict (user_id, course_id) do update set progress_pct = excluded.progress_pct;

insert into public.module_progress (user_id, module_id, completed, progress_pct)
select s.id, v.module_id, v.completed, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('m0030001-0000-4000-8000-000000000001'::uuid, true, 100),
  ('m0030001-0000-4000-8000-000000000002'::uuid, true, 100),
  ('m0030001-0000-4000-8000-000000000003'::uuid, false, 67)
) as v(module_id, completed, progress_pct)
where s.id is not null
on conflict (user_id, module_id) do update set
  completed = excluded.completed,
  progress_pct = excluded.progress_pct;

insert into public.lesson_progress (user_id, lesson_id, completed, progress_pct)
select s.id, v.lesson_id, v.completed, v.progress_pct
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('l0030001-0000-4000-8000-000000000001'::uuid, true, 100),
  ('l0030001-0000-4000-8000-000000000002'::uuid, true, 100),
  ('l0030001-0000-4000-8000-000000000003'::uuid, true, 100),
  ('l0030001-0000-4000-8000-000000000004'::uuid, false, 57)
) as v(lesson_id, completed, progress_pct)
where s.id is not null
on conflict (user_id, lesson_id) do update set
  completed = excluded.completed,
  progress_pct = excluded.progress_pct;

insert into public.activity_events (event_type, title, meta)
select
  v.event_type,
  v.title,
  case v.event_type
    when 'enrollment' then jsonb_build_object('user_id', s.id)
    when 'lesson_complete' then jsonb_build_object(
      'user_id', s.id,
      'lesson_id', 'l0030001-0000-4000-8000-000000000003'::uuid
    )
  end
from (select id from public.profiles where role = 'student' order by created_at limit 1) s
cross join (values
  ('enrollment'::text, 'Marcus Harrison enrolled in Price Action Mastery'),
  ('lesson_complete'::text, 'Marcus Harrison completed Module 3 · Lesson 3')
) as v(event_type, title)
where s.id is not null;

insert into public.support_tickets (user_id, student_name, subject, message, channel, status)
select
  p.id,
  coalesce(p.full_name, 'Student'),
  'Quiz retry question',
  'Can I review my incorrect answers from the Module 2 quiz?',
  'email',
  'open'
from public.profiles p
where p.role = 'student'
order by p.created_at
limit 1;
