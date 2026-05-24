-- 062_approval_requests_sensitive_governance.sql
-- Governance approval requests for sensitive department actions.
-- Safe to run in Supabase SQL Editor (idempotent where possible).
-- Note: `approval_requests` may already exist from 036_governance_approval_requests.sql.

create table if not exists public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id),
  requester_name text,
  requester_role text,
  requester_dept text,
  action_type text not null,
  module text not null,
  target_id uuid,
  target_label text,
  description text not null,
  action_payload jsonb default '{}'::jsonb,
  status text not null default 'pending'
    check (status in (
      'pending','approved','rejected','executed','cancelled','expired'
    )),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','critical')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz default now() + interval '72 hours',
  deleted_at timestamptz
);

-- Legacy columns (036) — keep for backward compatibility
alter table public.approval_requests add column if not exists department_key text;
alter table public.approval_requests add column if not exists entity_type text;
alter table public.approval_requests add column if not exists entity_id text;
alter table public.approval_requests add column if not exists requested_at timestamptz default now();
alter table public.approval_requests add column if not exists payload_snapshot jsonb default '{}'::jsonb;
alter table public.approval_requests add column if not exists reason text;
alter table public.approval_requests add column if not exists approved_by uuid references auth.users(id);
alter table public.approval_requests add column if not exists approved_at timestamptz;
alter table public.approval_requests add column if not exists rejected_at timestamptz;
alter table public.approval_requests add column if not exists rejection_reason text;

-- New governance columns
alter table public.approval_requests add column if not exists requester_name text;
alter table public.approval_requests add column if not exists requester_role text;
alter table public.approval_requests add column if not exists requester_dept text;
alter table public.approval_requests add column if not exists module text;
alter table public.approval_requests add column if not exists target_id uuid;
alter table public.approval_requests add column if not exists target_label text;
alter table public.approval_requests add column if not exists description text;
alter table public.approval_requests add column if not exists action_payload jsonb default '{}'::jsonb;
alter table public.approval_requests add column if not exists priority text default 'normal';
alter table public.approval_requests add column if not exists reviewed_by uuid references auth.users(id);
alter table public.approval_requests add column if not exists reviewed_at timestamptz;
alter table public.approval_requests add column if not exists review_comment text;
alter table public.approval_requests add column if not exists updated_at timestamptz default now();
alter table public.approval_requests add column if not exists expires_at timestamptz default now() + interval '72 hours';
alter table public.approval_requests add column if not exists deleted_at timestamptz;

drop trigger if exists trg_approval_requests_updated_at on public.approval_requests;
create trigger trg_approval_requests_updated_at
  before update on public.approval_requests
  for each row execute function public.set_updated_at();

create index if not exists idx_approval_status
  on public.approval_requests(status) where deleted_at is null;
create index if not exists idx_approval_requester
  on public.approval_requests(requested_by, created_at desc);
create index if not exists idx_approval_created
  on public.approval_requests(created_at desc) where deleted_at is null;

alter table public.approval_requests enable row level security;

drop policy if exists "approval_own_select" on public.approval_requests;
create policy "approval_own_select" on public.approval_requests
  for select using (
    requested_by = auth.uid() or public.is_super_admin()
  );

drop policy if exists "approval_insert" on public.approval_requests;
create policy "approval_insert" on public.approval_requests
  for insert with check (requested_by = auth.uid());

drop policy if exists "approval_superadmin_update" on public.approval_requests;
create policy "approval_superadmin_update" on public.approval_requests
  for update using (public.is_super_admin());

-- In-app notifications (optional — used by approval service)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "notifications_insert_service" on public.notifications;
create policy "notifications_insert_service" on public.notifications
  for insert with check (public.is_super_admin());
