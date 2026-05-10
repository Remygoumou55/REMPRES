-- 060_enterprise_cloud_global_operations.sql
-- Catalogue régions / edge, politiques workloads, checkpoints DR, profils tenant↔région,
-- journal ops append-only — dépend de 055 (`erp_tenants`, `user_can_access_tenant`).

begin;

insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'cloud', true, true, true, true, null),
  ('manager', 'cloud', true, true, true, false, null),
  ('agent', 'cloud', false, true, false, false, null),
  ('accountant', 'cloud', false, true, false, false, null),
  ('auditor', 'cloud', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_cloud_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('cloud', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_cloud_module_permission(text) to authenticated;

create or replace function public.is_cloud_operator()
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

grant execute on function public.is_cloud_operator() to authenticated;

-- ─── Catalogue régions ─────────────────────────────────────────────────────────
create table if not exists public.erp_cloud_regions (
  id uuid primary key default gen_random_uuid(),
  region_key text not null,
  display_name text not null,
  provider_stub text not null default '',
  status text not null default 'active'
    check (status in ('active', 'maintenance', 'sunset')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_cloud_region_key_chk check (length(trim(region_key)) > 0),
  constraint erp_cloud_region_display_chk check (length(trim(display_name)) > 0)
);

drop trigger if exists trg_erp_cloud_regions_updated_at on public.erp_cloud_regions;
create trigger trg_erp_cloud_regions_updated_at
before update on public.erp_cloud_regions
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_cloud_region_key_lower
  on public.erp_cloud_regions (lower(region_key));

alter table public.erp_cloud_regions enable row level security;

drop policy if exists erp_cloud_regions_select on public.erp_cloud_regions;
create policy erp_cloud_regions_select on public.erp_cloud_regions for select to authenticated
using (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('read')
);

drop policy if exists erp_cloud_regions_insert on public.erp_cloud_regions;
create policy erp_cloud_regions_insert on public.erp_cloud_regions for insert to authenticated
with check (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('create')
);

drop policy if exists erp_cloud_regions_update on public.erp_cloud_regions;
create policy erp_cloud_regions_update on public.erp_cloud_regions for update to authenticated
using (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('update')
)
with check (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('update')
);

drop policy if exists erp_cloud_regions_delete on public.erp_cloud_regions;
create policy erp_cloud_regions_delete on public.erp_cloud_regions for delete to authenticated
using (
  public.is_super_admin()
  or public.is_cloud_operator()
  or public.user_has_cloud_module_permission('delete')
);

-- ─── Services edge par région ──────────────────────────────────────────────────
create table if not exists public.erp_cloud_edge_services (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.erp_cloud_regions(id) on delete cascade,
  service_key text not null,
  endpoint_stub text not null default '',
  status text not null default 'active'
    check (status in ('active', 'degraded', 'offline')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_cloud_edge_service_key_chk check (length(trim(service_key)) > 0)
);

drop trigger if exists trg_erp_cloud_edge_services_updated_at on public.erp_cloud_edge_services;
create trigger trg_erp_cloud_edge_services_updated_at
before update on public.erp_cloud_edge_services
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_cloud_edge_region_service_lower
  on public.erp_cloud_edge_services (region_id, lower(service_key));

alter table public.erp_cloud_edge_services enable row level security;

drop policy if exists erp_cloud_edge_services_select on public.erp_cloud_edge_services;
create policy erp_cloud_edge_services_select on public.erp_cloud_edge_services for select to authenticated
using (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('read')
);

drop policy if exists erp_cloud_edge_services_insert on public.erp_cloud_edge_services;
create policy erp_cloud_edge_services_insert on public.erp_cloud_edge_services for insert to authenticated
with check (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('create')
);

drop policy if exists erp_cloud_edge_services_update on public.erp_cloud_edge_services;
create policy erp_cloud_edge_services_update on public.erp_cloud_edge_services for update to authenticated
using (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('update')
)
with check (
  public.is_cloud_operator()
  or public.user_has_cloud_module_permission('update')
);

drop policy if exists erp_cloud_edge_services_delete on public.erp_cloud_edge_services;
create policy erp_cloud_edge_services_delete on public.erp_cloud_edge_services for delete to authenticated
using (
  public.is_super_admin()
  or public.is_cloud_operator()
  or public.user_has_cloud_module_permission('delete')
);

-- ─── Journal cloud (append-only) ─────────────────────────────────────────────
create table if not exists public.erp_cloud_operations_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete set null,
  region_id uuid references public.erp_cloud_regions(id) on delete set null,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  created_at timestamptz not null default now(),
  constraint erp_cloud_ops_event_kind_chk check (length(trim(event_kind)) > 0)
);

create index if not exists idx_erp_cloud_ops_created on public.erp_cloud_operations_events (created_at desc);

create or replace function public.trg_erp_cloud_operations_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_cloud_operations_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_cloud_ops_no_mut on public.erp_cloud_operations_events;
create trigger trg_erp_cloud_ops_no_mut
before update or delete on public.erp_cloud_operations_events
for each row execute procedure public.trg_erp_cloud_operations_events_append_only();

alter table public.erp_cloud_operations_events enable row level security;

drop policy if exists erp_cloud_ops_events_select on public.erp_cloud_operations_events;
create policy erp_cloud_ops_events_select on public.erp_cloud_operations_events for select to authenticated
using (
  public.is_cloud_operator()
  or (
    tenant_id is null
    and public.user_has_cloud_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('read')
  )
);

drop policy if exists erp_cloud_ops_events_insert on public.erp_cloud_operations_events;
create policy erp_cloud_ops_events_insert on public.erp_cloud_operations_events for insert to authenticated
with check (
  public.is_cloud_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('create')
  )
);

-- ─── Checkpoints reprise (tenant × région) ─────────────────────────────────────
create table if not exists public.erp_cloud_recovery_checkpoints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  region_id uuid not null references public.erp_cloud_regions(id) on delete cascade,
  checkpoint_key text not null default '',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_cloud_recovery_checkpoints_updated_at on public.erp_cloud_recovery_checkpoints;
create trigger trg_erp_cloud_recovery_checkpoints_updated_at
before update on public.erp_cloud_recovery_checkpoints
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_cloud_recovery_checkpoint
  on public.erp_cloud_recovery_checkpoints (tenant_id, region_id, lower(checkpoint_key));

alter table public.erp_cloud_recovery_checkpoints enable row level security;

drop policy if exists erp_cloud_recovery_checkpoints_select on public.erp_cloud_recovery_checkpoints;
create policy erp_cloud_recovery_checkpoints_select on public.erp_cloud_recovery_checkpoints for select to authenticated
using (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('read')
  )
);

drop policy if exists erp_cloud_recovery_checkpoints_insert on public.erp_cloud_recovery_checkpoints;
create policy erp_cloud_recovery_checkpoints_insert on public.erp_cloud_recovery_checkpoints for insert to authenticated
with check (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('create')
  )
);

drop policy if exists erp_cloud_recovery_checkpoints_update on public.erp_cloud_recovery_checkpoints;
create policy erp_cloud_recovery_checkpoints_update on public.erp_cloud_recovery_checkpoints for update to authenticated
using (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
)
with check (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
);

drop policy if exists erp_cloud_recovery_checkpoints_delete on public.erp_cloud_recovery_checkpoints;
create policy erp_cloud_recovery_checkpoints_delete on public.erp_cloud_recovery_checkpoints for delete to authenticated
using (
  public.is_super_admin()
  or public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('delete')
  )
);

-- ─── Profil régional par tenant (1 ligne / tenant) ─────────────────────────────
create table if not exists public.erp_cloud_tenant_region_profiles (
  tenant_id uuid primary key references public.erp_tenants(id) on delete cascade,
  primary_region_id uuid not null references public.erp_cloud_regions(id) on delete restrict,
  secondary_region_id uuid references public.erp_cloud_regions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_cloud_tenant_region_profiles_updated_at on public.erp_cloud_tenant_region_profiles;
create trigger trg_erp_cloud_tenant_region_profiles_updated_at
before update on public.erp_cloud_tenant_region_profiles
for each row execute procedure public.set_updated_at();

alter table public.erp_cloud_tenant_region_profiles enable row level security;

drop policy if exists erp_cloud_tenant_region_profiles_select on public.erp_cloud_tenant_region_profiles;
create policy erp_cloud_tenant_region_profiles_select on public.erp_cloud_tenant_region_profiles for select to authenticated
using (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('read')
  )
);

drop policy if exists erp_cloud_tenant_region_profiles_insert on public.erp_cloud_tenant_region_profiles;
create policy erp_cloud_tenant_region_profiles_insert on public.erp_cloud_tenant_region_profiles for insert to authenticated
with check (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('create')
  )
);

drop policy if exists erp_cloud_tenant_region_profiles_update on public.erp_cloud_tenant_region_profiles;
create policy erp_cloud_tenant_region_profiles_update on public.erp_cloud_tenant_region_profiles for update to authenticated
using (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
)
with check (
  public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
);

drop policy if exists erp_cloud_tenant_region_profiles_delete on public.erp_cloud_tenant_region_profiles;
create policy erp_cloud_tenant_region_profiles_delete on public.erp_cloud_tenant_region_profiles for delete to authenticated
using (
  public.is_super_admin()
  or public.is_cloud_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('delete')
  )
);

-- ─── Politiques de charge / routing ─────────────────────────────────────────────
create table if not exists public.erp_cloud_workload_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  region_id uuid not null references public.erp_cloud_regions(id) on delete cascade,
  policy_key text not null,
  priority int not null default 100,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_cloud_workload_policy_key_chk check (length(trim(policy_key)) > 0)
);

drop trigger if exists trg_erp_cloud_workload_policies_updated_at on public.erp_cloud_workload_policies;
create trigger trg_erp_cloud_workload_policies_updated_at
before update on public.erp_cloud_workload_policies
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_cloud_workload_global_lower
  on public.erp_cloud_workload_policies (region_id, lower(policy_key))
  where tenant_id is null;

create unique index if not exists uq_erp_cloud_workload_tenant_lower
  on public.erp_cloud_workload_policies (tenant_id, region_id, lower(policy_key))
  where tenant_id is not null;

alter table public.erp_cloud_workload_policies enable row level security;

drop policy if exists erp_cloud_workload_policies_select on public.erp_cloud_workload_policies;
create policy erp_cloud_workload_policies_select on public.erp_cloud_workload_policies for select to authenticated
using (
  public.is_cloud_operator()
  or (
    tenant_id is null
    and public.user_has_cloud_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('read')
  )
);

drop policy if exists erp_cloud_workload_policies_insert on public.erp_cloud_workload_policies;
create policy erp_cloud_workload_policies_insert on public.erp_cloud_workload_policies for insert to authenticated
with check (
  public.is_cloud_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('create')
  )
);

drop policy if exists erp_cloud_workload_policies_update on public.erp_cloud_workload_policies;
create policy erp_cloud_workload_policies_update on public.erp_cloud_workload_policies for update to authenticated
using (
  public.is_cloud_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
)
with check (
  public.is_cloud_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('update')
  )
);

drop policy if exists erp_cloud_workload_policies_delete on public.erp_cloud_workload_policies;
create policy erp_cloud_workload_policies_delete on public.erp_cloud_workload_policies for delete to authenticated
using (
  public.is_super_admin()
  or public.is_cloud_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_cloud_module_permission('delete')
  )
);

-- ─── Seed catalogue minimal ────────────────────────────────────────────────────
insert into public.erp_cloud_regions (region_key, display_name, provider_stub, status, metadata)
select 'eu-west', 'Europe (ouest)', 'stub', 'active', '{"phase":1}'::jsonb
where not exists (
  select 1 from public.erp_cloud_regions r where lower(r.region_key) = lower('eu-west')
);

commit;
