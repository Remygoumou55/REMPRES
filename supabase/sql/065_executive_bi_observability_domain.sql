-- 065_executive_bi_observability_domain.sql
-- Executive / BI / Observability Hub — KPI registry, forecasts, signals, permissions.

begin;

insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'executive', true, true, true, true, null),
  ('super_admin', 'bi', true, true, true, true, null),
  ('manager', 'executive', false, true, false, false, null),
  ('manager', 'bi', false, true, true, false, null),
  ('agent', 'executive', false, true, false, false, null),
  ('agent', 'bi', false, true, false, false, null),
  ('accountant', 'executive', false, true, false, false, null),
  ('accountant', 'bi', false, true, false, false, null),
  ('auditor', 'executive', false, true, false, false, null),
  ('auditor', 'bi', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

-- ─── KPI registry (ONE KPI TRUTH)
create table if not exists public.erp_bi_kpi_definitions (
  id uuid primary key default gen_random_uuid(),
  kpi_key text not null,
  label text not null,
  domain_key text not null,
  source_entity text not null,
  source_metric text not null,
  unit text not null default 'count' check (unit in ('count', 'currency', 'percent')),
  owner_role text not null default 'executive',
  warning_threshold numeric(18, 4) null,
  critical_threshold numeric(18, 4) null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_bi_kpi_definitions_key unique (kpi_key)
);

drop trigger if exists trg_erp_bi_kpi_definitions_updated_at on public.erp_bi_kpi_definitions;
create trigger trg_erp_bi_kpi_definitions_updated_at
before update on public.erp_bi_kpi_definitions
for each row execute procedure public.set_updated_at();

-- ─── KPI history snapshots
create table if not exists public.erp_bi_kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  kpi_key text not null references public.erp_bi_kpi_definitions(kpi_key) on delete cascade,
  period_start date not null,
  value_numeric numeric(18, 4) not null,
  source_hash text not null,
  computed_at timestamptz not null default now(),
  constraint uq_erp_bi_kpi_snapshots_period unique (kpi_key, period_start)
);

create index if not exists idx_erp_bi_kpi_snapshots_key on public.erp_bi_kpi_snapshots(kpi_key);

-- ─── Forecasts
create table if not exists public.erp_executive_forecasts (
  id uuid primary key default gen_random_uuid(),
  forecast_key text not null,
  metric_key text not null,
  horizon text not null check (horizon in ('30d', '90d', 'quarter')),
  baseline_value numeric(18, 4) not null default 0,
  projected_value numeric(18, 4) not null default 0,
  variance_pct numeric(8, 4) not null default 0,
  confidence numeric(5, 4) not null default 0.75 check (confidence >= 0 and confidence <= 1),
  assumptions jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint uq_erp_executive_forecasts_key unique (forecast_key)
);

-- ─── Executive signals / alerting
create table if not exists public.erp_executive_signals (
  id uuid primary key default gen_random_uuid(),
  signal_key text not null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null,
  body text not null,
  source_domain text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  entity_type text null,
  entity_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  constraint uq_erp_executive_signals_key unique (signal_key)
);

create index if not exists idx_erp_executive_signals_status on public.erp_executive_signals(status);

-- Seed KPI definitions (canonical registry)
insert into public.erp_bi_kpi_definitions (
  kpi_key, label, domain_key, source_entity, source_metric, unit, owner_role, warning_threshold, critical_threshold
)
values
  ('company.revenue_month', 'Revenus mensuels', 'finance', 'sales', 'sum_total_amount_gnf', 'currency', 'finance', null, null),
  ('company.expenses_month', 'Dépenses mensuelles', 'finance', 'expenses', 'sum_amount_gnf', 'currency', 'finance', null, null),
  ('company.net_margin', 'Marge nette', 'finance', 'computed', 'revenue_minus_expenses', 'currency', 'executive', 0, null),
  ('crm.pipeline_open', 'Pipeline ouvert', 'vente', 'crm_opportunities', 'count_active', 'count', 'vente', null, null),
  ('crm.leads_open', 'Leads ouverts', 'vente', 'crm_leads', 'count_qualified', 'count', 'vente', null, null),
  ('rh.contracts_active', 'Contrats actifs', 'rh', 'rh_employee_contracts', 'count_active', 'count', 'rh', null, null),
  ('supply.inventory_on_hand', 'Stock total', 'logistique', 'logistics_inventory_balances', 'sum_qty_on_hand', 'count', 'logistics', null, null),
  ('ops.tasks_backlog', 'Backlog tâches', 'consultation', 'erp_ops_tasks', 'count_open', 'count', 'operations', 10, 25),
  ('ops.delivery_delayed', 'Livraisons en retard', 'consultation', 'erp_ops_deliveries', 'count_delayed', 'count', 'operations', 1, 5),
  ('observability.incidents_open', 'Incidents ouverts', 'platform', 'erp_observability_incidents', 'count_open', 'count', 'observability', 3, 10),
  ('governance.approvals_pending', 'Approbations en attente', 'platform', 'approval_requests', 'count_pending', 'count', 'governance', 5, 15)
on conflict (kpi_key) do update
set
  label = excluded.label,
  source_entity = excluded.source_entity,
  source_metric = excluded.source_metric,
  updated_at = now();

-- RLS
alter table public.erp_bi_kpi_definitions enable row level security;
alter table public.erp_bi_kpi_snapshots enable row level security;
alter table public.erp_executive_forecasts enable row level security;
alter table public.erp_executive_signals enable row level security;

drop policy if exists erp_bi_kpi_def_select on public.erp_bi_kpi_definitions;
create policy erp_bi_kpi_def_select on public.erp_bi_kpi_definitions for select to authenticated
using (public.user_has_module_permission('bi', 'read') or public.user_has_module_permission('executive', 'read'));

drop policy if exists erp_bi_kpi_snap_select on public.erp_bi_kpi_snapshots;
create policy erp_bi_kpi_snap_select on public.erp_bi_kpi_snapshots for select to authenticated
using (public.user_has_module_permission('bi', 'read') or public.user_has_module_permission('executive', 'read'));

drop policy if exists erp_bi_kpi_snap_insert on public.erp_bi_kpi_snapshots;
create policy erp_bi_kpi_snap_insert on public.erp_bi_kpi_snapshots for insert to authenticated
with check (public.user_has_module_permission('bi', 'update'));

drop policy if exists erp_exec_forecast_select on public.erp_executive_forecasts;
create policy erp_exec_forecast_select on public.erp_executive_forecasts for select to authenticated
using (public.user_has_module_permission('executive', 'read'));

drop policy if exists erp_exec_forecast_insert on public.erp_executive_forecasts;
create policy erp_exec_forecast_insert on public.erp_executive_forecasts for insert to authenticated
with check (
  public.user_has_module_permission('executive', 'create')
  and created_by = auth.uid()
);

drop policy if exists erp_exec_signals_select on public.erp_executive_signals;
create policy erp_exec_signals_select on public.erp_executive_signals for select to authenticated
using (public.user_has_module_permission('executive', 'read'));

drop policy if exists erp_exec_signals_insert on public.erp_executive_signals;
create policy erp_exec_signals_insert on public.erp_executive_signals for insert to authenticated
with check (public.user_has_module_permission('bi', 'update'));

drop policy if exists erp_exec_signals_update on public.erp_executive_signals;
create policy erp_exec_signals_update on public.erp_executive_signals for update to authenticated
using (public.user_has_module_permission('bi', 'update'))
with check (public.user_has_module_permission('bi', 'update'));

commit;
