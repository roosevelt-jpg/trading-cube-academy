-- Add CMS image fields for courses and testimonials
alter table public.courses add column if not exists image_url text;
alter table public.testimonials add column if not exists image_url text;
alter table public.page_contents add column if not exists hero_image_url text;
