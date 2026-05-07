-- 037_governance_alerts.sql
-- Governance alert center entity + RLS

create table if not exists public.governance_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  department_key text null,
  title text not null,
  description text not null,
  entity_type text null,
  entity_id text null,
  triggered_by uuid null references auth.users(id) on delete set null,
  status text not null default 'unread' check (status in ('unread', 'acknowledged', 'resolved')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists idx_governance_alerts_status_created_at
  on public.governance_alerts(status, created_at desc);

create index if not exists idx_governance_alerts_severity_status
  on public.governance_alerts(severity, status);

create index if not exists idx_governance_alerts_department
  on public.governance_alerts(department_key, created_at desc);

alter table public.governance_alerts enable row level security;

drop policy if exists "governance_alerts_select_super_admin" on public.governance_alerts;
create policy "governance_alerts_select_super_admin"
on public.governance_alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
);

drop policy if exists "governance_alerts_insert_super_admin_or_system" on public.governance_alerts;
create policy "governance_alerts_insert_super_admin_or_system"
on public.governance_alerts
for insert
to authenticated
with check (
  triggered_by = auth.uid()
  or triggered_by is null
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
);

drop policy if exists "governance_alerts_update_super_admin" on public.governance_alerts;
create policy "governance_alerts_update_super_admin"
on public.governance_alerts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
);
