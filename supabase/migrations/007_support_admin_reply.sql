-- Support ticket admin replies
alter table public.support_tickets
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz;
