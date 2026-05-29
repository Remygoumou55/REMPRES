-- RemPres ERP — Phase 2 : RLS gouvernance alignée sur is_super_admin() (system_authority)
-- Prérequis : 093_system_authority.sql appliqué en production.
-- Migration progressive : tables gouvernance critiques uniquement.

-- ─── approval_requests ───────────────────────────────────────────────────────

drop policy if exists "approval_requests_select" on public.approval_requests;
create policy "approval_requests_select"
on public.approval_requests
for select
to authenticated
using (
  requested_by = auth.uid()
  or public.is_super_admin()
);

drop policy if exists "approval_requests_update_super_admin" on public.approval_requests;
create policy "approval_requests_update_super_admin"
on public.approval_requests
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- ─── governance_alerts (si présent) ──────────────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'governance_alerts'
  ) then
    execute 'drop policy if exists governance_alerts_select_super on public.governance_alerts';
    execute $p$
      create policy governance_alerts_select_super
      on public.governance_alerts
      for select
      to authenticated
      using (
        public.is_super_admin()
        or exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.deleted_at is null
        )
      )
    $p$;
  end if;
end $$;

-- ─── governance_audit_events (si présent) ────────────────────────────────────

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'governance_audit_events'
  ) then
    execute 'drop policy if exists governance_audit_events_select_super on public.governance_audit_events';
    execute $p$
      create policy governance_audit_events_select_super
      on public.governance_audit_events
      for select
      to authenticated
      using (public.is_super_admin())
    $p$;
  end if;
end $$;

comment on function public.is_super_admin() is
  'Phase 2 — true si profiles.system_authority ROOT/SUPER_ADMIN ou role_key super_admin (via 093).';
