-- 038_governance_audit_events.sql
-- Enterprise governance audit & compliance immutable event ledger

create table if not exists public.governance_audit_events (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'authentication',
      'approval',
      'mutation',
      'archive',
      'invitation',
      'governance',
      'security',
      'system'
    )
  ),
  severity text not null check (severity in ('informational', 'warning', 'critical', 'security')),
  department_key text null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  actor_role text null,
  action_type text not null,
  entity_type text null,
  entity_id text null,
  before_snapshot jsonb null,
  after_snapshot jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_governance_audit_created_at
  on public.governance_audit_events(created_at desc);

create index if not exists idx_governance_audit_category_severity
  on public.governance_audit_events(category, severity, created_at desc);

create index if not exists idx_governance_audit_department
  on public.governance_audit_events(department_key, created_at desc);

create index if not exists idx_governance_audit_actor
  on public.governance_audit_events(actor_user_id, created_at desc);

alter table public.governance_audit_events enable row level security;

drop policy if exists "governance_audit_events_select_super_admin" on public.governance_audit_events;
create policy "governance_audit_events_select_super_admin"
on public.governance_audit_events
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

drop policy if exists "governance_audit_events_insert_authenticated" on public.governance_audit_events;
create policy "governance_audit_events_insert_authenticated"
on public.governance_audit_events
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  or actor_user_id is null
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
);
