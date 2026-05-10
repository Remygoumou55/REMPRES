-- 059_enterprise_testing_resilience_platform.sql
-- Chaîne résilience / tests distribués : scénarios, runs validation, snapshots métriques,
-- journal ops append-only — dépend de 055 (`erp_tenants`, `user_can_access_tenant`).

begin;

insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'resilience', true, true, true, true, null),
  ('manager', 'resilience', true, true, true, false, null),
  ('agent', 'resilience', false, true, false, false, null),
  ('accountant', 'resilience', false, true, false, false, null),
  ('auditor', 'resilience', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_resilience_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('resilience', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_resilience_module_permission(text) to authenticated;

create or replace function public.is_resilience_operator()
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
        and upper(coalesce(p.department_key, '')) = 'ADMINISTRATION'
    );
$$;

grant execute on function public.is_resilience_operator() to authenticated;

-- ─── Catalogue scénarios (chaos, charge, files, IA, etc.) ───────────────────────
create table if not exists public.erp_resilience_scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  scenario_key text not null,
  category text not null
    check (category in (
      'chaos', 'load', 'failover', 'realtime', 'queue', 'orchestration',
      'ai', 'tenant', 'ecosystem', 'recovery', 'sla', 'governance'
    )),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_resilience_scenario_key_chk check (length(trim(scenario_key)) > 0)
);

drop trigger if exists trg_erp_resilience_scenarios_updated_at on public.erp_resilience_scenarios;
create trigger trg_erp_resilience_scenarios_updated_at
before update on public.erp_resilience_scenarios
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_resilience_scenario_global
  on public.erp_resilience_scenarios (lower(scenario_key))
  where tenant_id is null;

create unique index if not exists uq_erp_resilience_scenario_tenant
  on public.erp_resilience_scenarios (tenant_id, lower(scenario_key))
  where tenant_id is not null;

alter table public.erp_resilience_scenarios enable row level security;

drop policy if exists erp_resilience_scenarios_select on public.erp_resilience_scenarios;
create policy erp_resilience_scenarios_select on public.erp_resilience_scenarios for select to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is null
    and public.user_has_resilience_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('read')
  )
);

drop policy if exists erp_resilience_scenarios_insert on public.erp_resilience_scenarios;
create policy erp_resilience_scenarios_insert on public.erp_resilience_scenarios for insert to authenticated
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('create')
  )
);

drop policy if exists erp_resilience_scenarios_update on public.erp_resilience_scenarios;
create policy erp_resilience_scenarios_update on public.erp_resilience_scenarios for update to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
)
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
);

drop policy if exists erp_resilience_scenarios_delete on public.erp_resilience_scenarios;
create policy erp_resilience_scenarios_delete on public.erp_resilience_scenarios for delete to authenticated
using (
  public.is_super_admin()
  or public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('delete')
  )
);

-- ─── Runs validation ──────────────────────────────────────────────────────────────
create table if not exists public.erp_resilience_validation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  scenario_id uuid references public.erp_resilience_scenarios(id) on delete set null,
  run_kind text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'passed', 'failed', 'skipped', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  constraint erp_resilience_run_kind_chk check (length(trim(run_kind)) > 0)
);

create index if not exists idx_erp_resilience_runs_started on public.erp_resilience_validation_runs (started_at desc);

alter table public.erp_resilience_validation_runs enable row level security;

drop policy if exists erp_resilience_runs_select on public.erp_resilience_validation_runs;
create policy erp_resilience_runs_select on public.erp_resilience_validation_runs for select to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is null
    and public.user_has_resilience_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('read')
  )
);

drop policy if exists erp_resilience_runs_insert on public.erp_resilience_validation_runs;
create policy erp_resilience_runs_insert on public.erp_resilience_validation_runs for insert to authenticated
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('create')
  )
);

drop policy if exists erp_resilience_runs_update on public.erp_resilience_validation_runs;
create policy erp_resilience_runs_update on public.erp_resilience_validation_runs for update to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
)
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
);

drop policy if exists erp_resilience_runs_delete on public.erp_resilience_validation_runs;
create policy erp_resilience_runs_delete on public.erp_resilience_validation_runs for delete to authenticated
using (
  public.is_super_admin()
  or public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('delete')
  )
);

-- ─── Snapshots métriques SLA / stabilité ───────────────────────────────────────────
create table if not exists public.erp_resilience_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  metric_key text not null,
  value numeric not null,
  captured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint erp_resilience_metric_key_chk check (length(trim(metric_key)) > 0)
);

create index if not exists idx_erp_resilience_metric_captured on public.erp_resilience_metric_snapshots (captured_at desc);

alter table public.erp_resilience_metric_snapshots enable row level security;

drop policy if exists erp_resilience_metric_snapshots_select on public.erp_resilience_metric_snapshots;
create policy erp_resilience_metric_snapshots_select on public.erp_resilience_metric_snapshots for select to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is null
    and public.user_has_resilience_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('read')
  )
);

drop policy if exists erp_resilience_metric_snapshots_insert on public.erp_resilience_metric_snapshots;
create policy erp_resilience_metric_snapshots_insert on public.erp_resilience_metric_snapshots for insert to authenticated
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('create')
  )
);

drop policy if exists erp_resilience_metric_snapshots_update on public.erp_resilience_metric_snapshots;
create policy erp_resilience_metric_snapshots_update on public.erp_resilience_metric_snapshots for update to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
)
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('update')
  )
);

drop policy if exists erp_resilience_metric_snapshots_delete on public.erp_resilience_metric_snapshots;
create policy erp_resilience_metric_snapshots_delete on public.erp_resilience_metric_snapshots for delete to authenticated
using (
  public.is_super_admin()
  or public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('delete')
  )
);

-- ─── Journal plateforme résilience (append-only) ─────────────────────────────────
create table if not exists public.erp_resilience_platform_operations_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete set null,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  created_at timestamptz not null default now(),
  constraint erp_resilience_plat_ops_event_kind_chk check (length(trim(event_kind)) > 0)
);

create index if not exists idx_erp_resilience_plat_ops_created on public.erp_resilience_platform_operations_events (created_at desc);

create or replace function public.trg_erp_resilience_platform_operations_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_resilience_platform_operations_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_resilience_plat_ops_no_mut on public.erp_resilience_platform_operations_events;
create trigger trg_erp_resilience_plat_ops_no_mut
before update or delete on public.erp_resilience_platform_operations_events
for each row execute procedure public.trg_erp_resilience_platform_operations_events_append_only();

alter table public.erp_resilience_platform_operations_events enable row level security;

drop policy if exists erp_resilience_plat_ops_select on public.erp_resilience_platform_operations_events;
create policy erp_resilience_plat_ops_select on public.erp_resilience_platform_operations_events for select to authenticated
using (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('read')
  )
);

drop policy if exists erp_resilience_plat_ops_insert on public.erp_resilience_platform_operations_events;
create policy erp_resilience_plat_ops_insert on public.erp_resilience_platform_operations_events for insert to authenticated
with check (
  public.is_resilience_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_resilience_module_permission('create')
  )
);

insert into public.erp_resilience_scenarios (tenant_id, scenario_key, category, enabled, metadata)
select null, 'chaos.smoke.declared', 'chaos', true, '{"stub":true}'::jsonb
where not exists (
  select 1 from public.erp_resilience_scenarios s
  where s.tenant_id is null and lower(s.scenario_key) = lower('chaos.smoke.declared')
);

commit;
