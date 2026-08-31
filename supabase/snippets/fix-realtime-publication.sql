-- Run this in Supabase SQL Editor if 001_schema.sql failed on realtime publication.
-- Safe to re-run — skips tables already in supabase_realtime.

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
