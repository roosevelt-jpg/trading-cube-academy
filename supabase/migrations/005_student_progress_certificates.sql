-- Certificate final score + student activity insert policy
alter table public.certificates
  add column if not exists final_score int;

drop policy if exists "students insert own activity" on public.activity_events;
create policy "students insert own activity"
  on public.activity_events for insert
  with check (
    (meta->>'user_id')::uuid = auth.uid()
    or public.is_admin()
  );
