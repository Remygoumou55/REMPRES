-- 061_executive_admin_dashboard_aggregates.sql
-- Executive/Admin consolidated KPI materialization layer.

begin;

create materialized view if not exists public.mv_executive_dashboard_kpis as
with sales_month as (
  select coalesce(sum(s.total_amount_gnf), 0)::numeric as revenue_month,
         count(*)::bigint as sales_count
  from public.sales s
  where s.created_at >= date_trunc('month', now())
),
expenses_month as (
  select coalesce(sum(e.amount_gnf), 0)::numeric as expenses_month,
         count(*)::bigint as expenses_count
  from public.expenses e
  where e.created_at >= date_trunc('month', now())
),
crm_block as (
  select
    count(*) filter (where l.deleted_at is null and l.status in ('new','contacted','qualified'))::bigint as open_leads,
    (select count(*)::bigint from public.crm_opportunities o where o.deleted_at is null) as open_opportunities
  from public.crm_leads l
),
logistics_block as (
  select
    (select count(*)::bigint from public.logistics_warehouses w where w.is_active) as active_warehouses,
    (select count(*)::bigint from public.logistics_suppliers s where s.is_active) as active_suppliers,
    (select count(*)::bigint from public.logistics_purchase_orders po where po.status in ('submitted','approved','partially_received')) as open_purchase_orders,
    (select coalesce(sum(lb.qty_on_hand),0)::numeric from public.logistics_inventory_balances lb) as inventory_on_hand
),
rh_block as (
  select
    (select count(*)::bigint from public.rh_employee_contracts c where c.status = 'active') as active_contracts,
    (
      select count(*)::bigint
      from public.rh_recruitment_candidates rc
      where rc.pipeline_stage in ('sourced', 'screening', 'interview', 'offer', 'pending_hire_approval')
    ) as open_recruitments
),
observability_block as (
  select count(*)::bigint as open_incidents
  from public.erp_observability_incidents i
  where i.status in ('open','investigating')
)
select
  'executive_global_v1'::text as scope_key,
  sm.revenue_month,
  em.expenses_month,
  sm.sales_count,
  em.expenses_count,
  crm.open_leads,
  crm.open_opportunities,
  lg.active_warehouses,
  lg.active_suppliers,
  lg.open_purchase_orders,
  lg.inventory_on_hand,
  rh.active_contracts,
  rh.open_recruitments,
  ob.open_incidents,
  now() at time zone 'utc' as computed_at
from sales_month sm
cross join expenses_month em
cross join crm_block crm
cross join logistics_block lg
cross join rh_block rh
cross join observability_block ob;

create unique index if not exists mv_executive_dashboard_kpis_scope_idx
  on public.mv_executive_dashboard_kpis (scope_key);

create materialized view if not exists public.mv_admin_platform_dashboard_kpis as
with jobs as (
  select
    count(*) filter (where status = 'pending')::bigint as jobs_pending,
    count(*) filter (where status = 'failed' and updated_at >= (now() - interval '24 hours'))::bigint as jobs_failed_24h
  from public.erp_infrastructure_jobs
),
obs as (
  select
    (select count(*)::bigint from public.erp_observability_incidents i where i.status in ('open','investigating')) as incidents_open,
    (select count(*)::bigint from public.erp_observability_anomalies a where a.status = 'open') as anomalies_open
),
compliance as (
  select count(*)::bigint as risk_signals_open
  from public.erp_compliance_risk_signals r
  where r.status = 'open'
),
tenants as (
  select
    (select count(*)::bigint from public.erp_tenants t where t.status = 'active') as tenants_active,
    (select count(*)::bigint from public.erp_tenant_analytics_snapshots tas) as tenant_snapshots
)
select
  'admin_platform_v1'::text as scope_key,
  j.jobs_pending,
  j.jobs_failed_24h,
  o.incidents_open,
  o.anomalies_open,
  c.risk_signals_open,
  t.tenants_active,
  t.tenant_snapshots,
  now() at time zone 'utc' as computed_at
from jobs j
cross join obs o
cross join compliance c
cross join tenants t;

create unique index if not exists mv_admin_platform_dashboard_kpis_scope_idx
  on public.mv_admin_platform_dashboard_kpis (scope_key);

create or replace function public.refresh_executive_admin_dashboard_aggregates()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  executive_payload jsonb;
  admin_payload jsonb;
begin
  refresh materialized view public.mv_executive_dashboard_kpis;
  refresh materialized view public.mv_admin_platform_dashboard_kpis;

  select to_jsonb(mv) into executive_payload
  from public.mv_executive_dashboard_kpis mv
  where mv.scope_key = 'executive_global_v1'
  limit 1;

  insert into public.erp_analytics_snapshots(scope_key, payload, computed_at)
  values ('executive_global_v1', coalesce(executive_payload, '{}'::jsonb), now() at time zone 'utc')
  on conflict (scope_key)
  do update
    set payload = excluded.payload,
        computed_at = excluded.computed_at;

  select to_jsonb(mv) into admin_payload
  from public.mv_admin_platform_dashboard_kpis mv
  where mv.scope_key = 'admin_platform_v1'
  limit 1;

  insert into public.erp_analytics_snapshots(scope_key, payload, computed_at)
  values ('admin_platform_v1', coalesce(admin_payload, '{}'::jsonb), now() at time zone 'utc')
  on conflict (scope_key)
  do update
    set payload = excluded.payload,
        computed_at = excluded.computed_at;
end;
$$;

select public.refresh_executive_admin_dashboard_aggregates();

commit;
