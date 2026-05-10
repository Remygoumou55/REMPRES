-- 046_erp_analytics_snapshots.sql
-- Snapshots analytics pré-agrégués (digest RH KPI dept) — calcul SECURITY DEFINER, lecture contrôlée RLS.

begin;

create table if not exists public.erp_analytics_snapshots (
  scope_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create index if not exists idx_erp_analytics_snapshots_computed_at
  on public.erp_analytics_snapshots(computed_at desc);

alter table public.erp_analytics_snapshots enable row level security;

drop policy if exists erp_analytics_snapshots_select on public.erp_analytics_snapshots;
create policy erp_analytics_snapshots_select
on public.erp_analytics_snapshots
for select
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
);

create or replace function public.refresh_rh_dept_kpis_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active int;
  v_pending_leaves int;
  v_unread int;
  v_attendance int;
  v_hires jsonb;
  v_day_start timestamptz;
begin
  v_day_start := date_trunc('day', now());

  select count(*)::int into v_active
  from public.profiles
  where deleted_at is null
    and lower(coalesce(role_key, '')) not in ('super_admin', 'directeur_general');

  select count(*)::int into v_pending_leaves
  from public.rh_leave_requests
  where status = 'pending';

  select count(*)::int into v_unread
  from public.governance_alerts
  where department_key = 'rh'
    and status = 'unread';

  select count(*)::int into v_attendance
  from public.rh_attendance_events
  where event_at >= v_day_start;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sub.id,
        'first_name', sub.first_name,
        'last_name', sub.last_name,
        'created_at', sub.created_at
      )
      order by sub.created_at desc nulls last
    ),
    '[]'::jsonb
  )
  into v_hires
  from (
    select id, first_name, last_name, created_at
    from public.profiles
    where deleted_at is null
    order by created_at desc nulls last
    limit 3
  ) sub;

  insert into public.erp_analytics_snapshots (scope_key, payload, computed_at)
  values (
    'rh_dept_kpis_v1',
    jsonb_build_object(
      'activeEmployees', v_active,
      'pendingLeaves', v_pending_leaves,
      'rhUnreadAlerts', v_unread,
      'attendanceToday', v_attendance,
      'recentHires', v_hires,
      'digestVersion', 1
    ),
    now()
  )
  on conflict (scope_key) do update
  set payload = excluded.payload,
      computed_at = excluded.computed_at;
end;
$$;

revoke all on function public.refresh_rh_dept_kpis_digest() from public;
grant execute on function public.refresh_rh_dept_kpis_digest() to service_role;

commit;
