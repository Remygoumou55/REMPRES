-- 041_rh_security_hardening.sql
-- RH security hardening: stricter scope checks + defensive triggers.

begin;

create or replace function public.is_rh_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_role()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.deleted_at is null
        and upper(coalesce(p.department_key, '')) = 'RH'
    );
$$;

drop policy if exists rh_leave_requests_select on public.rh_leave_requests;
create policy rh_leave_requests_select
on public.rh_leave_requests
for select
to authenticated
using (
  employee_id = auth.uid()
  or requested_by = auth.uid()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
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
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_leave_requests_update on public.rh_leave_requests;
create policy rh_leave_requests_update
on public.rh_leave_requests
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

drop policy if exists rh_attendance_events_select on public.rh_attendance_events;
create policy rh_attendance_events_select
on public.rh_attendance_events
for select
to authenticated
using (
  employee_id = auth.uid()
  or recorded_by = auth.uid()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
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
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_attendance_events_update on public.rh_attendance_events;
create policy rh_attendance_events_update
on public.rh_attendance_events
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

create or replace function public.rh_guard_leave_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.requested_by is distinct from new.requested_by then
    raise exception 'requested_by is immutable';
  end if;

  if old.employee_id is distinct from new.employee_id then
    raise exception 'employee_id is immutable';
  end if;

  if old.created_at is distinct from new.created_at then
    raise exception 'created_at is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rh_guard_leave_request_update on public.rh_leave_requests;
create trigger trg_rh_guard_leave_request_update
before update on public.rh_leave_requests
for each row
execute function public.rh_guard_leave_request_update();

commit;

