-- 036_governance_approval_requests.sql
-- Enterprise governance approvals table + RLS policies

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  department_key text not null,
  action_type text not null,
  entity_type text not null,
  entity_id text not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  payload_snapshot jsonb not null default '{}'::jsonb,
  reason text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  rejected_at timestamptz null,
  rejection_reason text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_approval_requests_status_requested_at
  on public.approval_requests(status, requested_at desc);

create index if not exists idx_approval_requests_department_status
  on public.approval_requests(department_key, status);

create index if not exists idx_approval_requests_entity_lookup
  on public.approval_requests(entity_type, entity_id, status);

alter table public.approval_requests enable row level security;

drop policy if exists "approval_requests_select" on public.approval_requests;
create policy "approval_requests_select"
on public.approval_requests
for select
to authenticated
using (
  requested_by = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.deleted_at is null
      and lower(coalesce(p.role_key, '')) = 'super_admin'
  )
);

drop policy if exists "approval_requests_insert" on public.approval_requests;
create policy "approval_requests_insert"
on public.approval_requests
for insert
to authenticated
with check (
  requested_by = auth.uid()
);

drop policy if exists "approval_requests_update_super_admin" on public.approval_requests;
create policy "approval_requests_update_super_admin"
on public.approval_requests
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
