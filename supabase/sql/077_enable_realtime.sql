-- RemPres ERP — Activer Supabase Realtime pour notifications temps réel
-- Run in Supabase SQL Editor:
--   supabase/sql/077_enable_realtime.sql

-- RLS : l'utilisateur peut marquer ses notifications comme lues
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.approval_requests;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.governance_alerts;
exception
  when duplicate_object then null;
end $$;
