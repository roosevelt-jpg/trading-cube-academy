-- Activity select scoped to own events; service role still bypasses RLS for admin inserts
drop policy if exists "students read activity" on public.activity_events;
create policy "students read own activity"
  on public.activity_events for select
  using (
    (meta->>'user_id')::uuid = auth.uid()
    or public.is_admin()
  );

-- Admins retain full read via is_admin(); legacy events without user_id remain admin-only visible
