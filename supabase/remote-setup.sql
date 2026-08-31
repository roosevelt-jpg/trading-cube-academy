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
where module_id = 'm0030001-0000-4000-8000-000000000003' and time_limit_seconds is null;
