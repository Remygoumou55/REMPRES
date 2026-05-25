-- 069_rh_records_schema.sql
-- RH operational records: employees, leave_requests, attendance (idempotent)
-- These tables back the responsable_rh CRUD interface. Independent of auth.users
-- so the HR team can manage non-system staff (typical for Guinea ERP).

begin;

-- ═══════════════════════════════════════════
-- EMPLOYEES (HR record-keeping)
-- ═══════════════════════════════════════════
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text,
  position text not null,
  department text not null,
  hire_date date not null default current_date,
  salary_gnf numeric(18, 2) default 0,
  contract_type text not null default 'cdi'
    check (contract_type in ('cdi', 'cdd', 'stage', 'freelance')),
  is_active boolean not null default true,
  user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_employees_active
  on public.employees(is_active) where deleted_at is null;
create index if not exists idx_employees_department
  on public.employees(department) where deleted_at is null;
create index if not exists idx_employees_hire_date
  on public.employees(hire_date desc) where deleted_at is null;

-- ═══════════════════════════════════════════
-- LEAVE REQUESTS
-- ═══════════════════════════════════════════
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type text not null
    check (leave_type in ('annual', 'sick', 'special', 'unpaid')),
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  review_comment text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  requested_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint leave_requests_dates_ck check (start_date <= end_date)
);

create index if not exists idx_leave_requests_employee_status
  on public.leave_requests(employee_id, status, start_date desc)
  where deleted_at is null;
create index if not exists idx_leave_requests_status_created
  on public.leave_requests(status, created_at desc)
  where deleted_at is null;

-- ═══════════════════════════════════════════
-- ATTENDANCE (daily records)
-- ═══════════════════════════════════════════
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null default current_date,
  status text not null default 'present'
    check (status in ('present', 'absent', 'late', 'half_day')),
  arrival_time time,
  departure_time time,
  notes text,
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, date)
);

create index if not exists idx_attendance_date
  on public.attendance(date desc);
create index if not exists idx_attendance_employee_date
  on public.attendance(employee_id, date desc);

-- ═══════════════════════════════════════════
-- TRIGGERS — updated_at
-- ═══════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger language plpgsql as $body$
    begin
      new.updated_at = now();
      return new;
    end;
    $body$;
  end if;
end$$;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

drop trigger if exists trg_leave_requests_updated_at on public.leave_requests;
create trigger trg_leave_requests_updated_at
  before update on public.leave_requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_attendance_updated_at on public.attendance;
create trigger trg_attendance_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════
alter table public.employees enable row level security;
alter table public.leave_requests enable row level security;
alter table public.attendance enable row level security;

-- ─── employees ─────────────────────────────
drop policy if exists employees_read on public.employees;
create policy employees_read
on public.employees
for select
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'read')
);

drop policy if exists employees_insert on public.employees;
create policy employees_insert
on public.employees
for insert
to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'create')
);

drop policy if exists employees_update on public.employees;
create policy employees_update
on public.employees
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

drop policy if exists employees_delete on public.employees;
create policy employees_delete
on public.employees
for delete
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'delete')
);

-- ─── leave_requests ────────────────────────
drop policy if exists leave_requests_read on public.leave_requests;
create policy leave_requests_read
on public.leave_requests
for select
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'read')
);

drop policy if exists leave_requests_insert on public.leave_requests;
create policy leave_requests_insert
on public.leave_requests
for insert
to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'create')
);

drop policy if exists leave_requests_update on public.leave_requests;
create policy leave_requests_update
on public.leave_requests
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

drop policy if exists leave_requests_delete on public.leave_requests;
create policy leave_requests_delete
on public.leave_requests
for delete
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'delete')
);

-- ─── attendance ────────────────────────────
drop policy if exists attendance_read on public.attendance;
create policy attendance_read
on public.attendance
for select
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'read')
);

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert
on public.attendance
for insert
to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'create')
);

drop policy if exists attendance_update on public.attendance;
create policy attendance_update
on public.attendance
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

drop policy if exists attendance_delete on public.attendance;
create policy attendance_delete
on public.attendance
for delete
to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('rh', 'delete')
);

commit;
