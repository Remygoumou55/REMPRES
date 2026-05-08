-- 040_rh_foundation_phase3.sql
-- RH Phase 3: dedicated HR tables (leave requests + attendance) with RLS.

begin;

create table if not exists public.rh_leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete restrict,
  leave_type text not null check (leave_type in ('paid', 'sick', 'exceptional')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rh_leave_requests_dates_ck check (start_date <= end_date)
);

create index if not exists idx_rh_leave_requests_employee_status
  on public.rh_leave_requests(employee_id, status, start_date desc);

create index if not exists idx_rh_leave_requests_status_created
  on public.rh_leave_requests(status, created_at desc);

create table if not exists public.rh_attendance_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete restrict,
  event_type text not null check (event_type in ('check_in', 'check_out', 'manual')),
  event_at timestamptz not null default now(),
  source text not null default 'erp' check (source in ('erp', 'admin', 'import')),
  notes text null,
  recorded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_attendance_employee_event_at
  on public.rh_attendance_events(employee_id, event_at desc);

create index if not exists idx_rh_attendance_event_at
  on public.rh_attendance_events(event_at desc);

alter table public.rh_leave_requests enable row level security;
alter table public.rh_attendance_events enable row level security;

drop policy if exists rh_leave_requests_select on public.rh_leave_requests;
create policy rh_leave_requests_select
on public.rh_leave_requests
for select
to authenticated
using (
  employee_id = auth.uid()
  or requested_by = auth.uid()
  or public.is_admin_role()
  or public.user_has_module_permission('rh', 'read')
);

drop policy if exists rh_leave_requests_insert on public.rh_leave_requests;
create policy rh_leave_requests_insert
on public.rh_leave_requests
for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (
    employee_id = auth.uid()
    or public.is_admin_role()
    or public.user_has_module_permission('rh', 'create')
  )
);

drop policy if exists rh_leave_requests_update on public.rh_leave_requests;
create policy rh_leave_requests_update
on public.rh_leave_requests
for update
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'update')
);

drop policy if exists rh_attendance_events_select on public.rh_attendance_events;
create policy rh_attendance_events_select
on public.rh_attendance_events
for select
to authenticated
using (
  employee_id = auth.uid()
  or recorded_by = auth.uid()
  or public.is_admin_role()
  or public.user_has_module_permission('rh', 'read')
);

drop policy if exists rh_attendance_events_insert on public.rh_attendance_events;
create policy rh_attendance_events_insert
on public.rh_attendance_events
for insert
to authenticated
with check (
  recorded_by = auth.uid()
  and (
    employee_id = auth.uid()
    or public.is_admin_role()
    or public.user_has_module_permission('rh', 'create')
  )
);

drop policy if exists rh_attendance_events_update on public.rh_attendance_events;
create policy rh_attendance_events_update
on public.rh_attendance_events
for update
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'update')
);

create or replace function public.touch_rh_leave_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_rh_leave_requests_updated_at on public.rh_leave_requests;
create trigger trg_touch_rh_leave_requests_updated_at
before update on public.rh_leave_requests
for each row
execute function public.touch_rh_leave_requests_updated_at();

commit;

