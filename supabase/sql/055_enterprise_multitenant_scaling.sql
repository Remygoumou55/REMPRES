-- 055_enterprise_multitenant_scaling.sql
-- Plateforme SaaS multi-tenant : registre tenants, adhésions utilisateurs, quotas / SLA,
-- fondations billing & conformité par tenant, analytics / recovery orchestrables,
-- colonne optionnelle tenant_id sur erp_infrastructure_jobs — sans refactor auth ni colonnes métier existantes.

begin;

-- ─── Permissions module multitenant ──────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'multitenant', true, true, true, true, null),
  ('manager', 'multitenant', true, true, true, false, null),
  ('agent', 'multitenant', false, true, false, false, null),
  ('accountant', 'multitenant', false, true, false, false, null),
  ('auditor', 'multitenant', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_multitenant_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('multitenant', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_multitenant_module_permission(text) to authenticated;

create or replace function public.is_multitenant_operator()
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

grant execute on function public.is_multitenant_operator() to authenticated;

-- ─── Registre tenants ───────────────────────────────────────────────────────
create table if not exists public.erp_tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  display_name text not null,
  region_key text not null default 'eu-west',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'provisioning', 'archived')),
  plan_key text not null default 'enterprise',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_tenants_slug_chk check (length(trim(slug)) > 0),
  constraint erp_tenants_display_chk check (length(trim(display_name)) > 0)
);

drop trigger if exists trg_erp_tenants_updated_at on public.erp_tenants;
create trigger trg_erp_tenants_updated_at
before update on public.erp_tenants
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_tenants_slug_lower on public.erp_tenants (lower(slug));

-- ─── Adhésions utilisateur ↔ tenant ─────────────────────────────────────────
create table if not exists public.erp_tenant_memberships (
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_role text not null default 'member'
    check (membership_role in ('owner', 'admin', 'member', 'billing', 'readonly')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists idx_erp_tenant_memberships_user on public.erp_tenant_memberships(user_id);

-- Fonction après création de erp_tenant_memberships (validation SQL au CREATE FUNCTION).
create or replace function public.user_can_access_tenant(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.erp_tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = p_tenant
    );
$$;

grant execute on function public.user_can_access_tenant(uuid) to authenticated;

alter table public.erp_tenants enable row level security;

drop policy if exists erp_tenants_select_visible on public.erp_tenants;
create policy erp_tenants_select_visible on public.erp_tenants for select to authenticated
using (public.user_can_access_tenant(id) or public.is_multitenant_operator());

drop policy if exists erp_tenants_insert_super_admin on public.erp_tenants;
create policy erp_tenants_insert_super_admin on public.erp_tenants for insert to authenticated
with check (public.is_super_admin());

drop policy if exists erp_tenants_update_operators on public.erp_tenants;
create policy erp_tenants_update_operators on public.erp_tenants for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenants_delete_super_admin on public.erp_tenants;
create policy erp_tenants_delete_super_admin on public.erp_tenants for delete to authenticated
using (public.is_super_admin());

alter table public.erp_tenant_memberships enable row level security;

drop policy if exists erp_tenant_memberships_select on public.erp_tenant_memberships;
create policy erp_tenant_memberships_select on public.erp_tenant_memberships for select to authenticated
using (
  user_id = auth.uid()
  or public.is_super_admin()
  or public.is_multitenant_operator()
);

drop policy if exists erp_tenant_memberships_mutate_operators on public.erp_tenant_memberships;
create policy erp_tenant_memberships_mutate_operators on public.erp_tenant_memberships for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_memberships_update_operators on public.erp_tenant_memberships;
create policy erp_tenant_memberships_update_operators on public.erp_tenant_memberships for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_memberships_delete_operators on public.erp_tenant_memberships;
create policy erp_tenant_memberships_delete_operators on public.erp_tenant_memberships for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

-- ─── Quotas & SLA (foundation) ──────────────────────────────────────────────
create table if not exists public.erp_tenant_quotas (
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  quota_key text not null,
  limit_value numeric not null check (limit_value >= 0),
  period text not null default 'all_time'
    check (period in ('daily', 'monthly', 'all_time')),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, quota_key),
  constraint erp_tenant_quotas_key_chk check (length(trim(quota_key)) > 0)
);

drop trigger if exists trg_erp_tenant_quotas_updated_at on public.erp_tenant_quotas;
create trigger trg_erp_tenant_quotas_updated_at
before update on public.erp_tenant_quotas
for each row execute procedure public.set_updated_at();

alter table public.erp_tenant_quotas enable row level security;

drop policy if exists erp_tenant_quotas_select on public.erp_tenant_quotas;
create policy erp_tenant_quotas_select on public.erp_tenant_quotas for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_quotas_insert_ops on public.erp_tenant_quotas;
create policy erp_tenant_quotas_insert_ops on public.erp_tenant_quotas for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_quotas_update_ops on public.erp_tenant_quotas;
create policy erp_tenant_quotas_update_ops on public.erp_tenant_quotas for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_quotas_delete_ops on public.erp_tenant_quotas;
create policy erp_tenant_quotas_delete_ops on public.erp_tenant_quotas for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

create table if not exists public.erp_tenant_sla_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  policy_key text not null,
  target_availability_pct numeric(5, 2) not null default 99.9
    check (target_availability_pct >= 0 and target_availability_pct <= 100),
  measurement_window_hours int not null default 720 check (measurement_window_hours > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, policy_key),
  constraint erp_tenant_sla_policy_key_chk check (length(trim(policy_key)) > 0)
);

drop trigger if exists trg_erp_tenant_sla_updated_at on public.erp_tenant_sla_policies;
create trigger trg_erp_tenant_sla_updated_at
before update on public.erp_tenant_sla_policies
for each row execute procedure public.set_updated_at();

alter table public.erp_tenant_sla_policies enable row level security;

drop policy if exists erp_tenant_sla_select on public.erp_tenant_sla_policies;
create policy erp_tenant_sla_select on public.erp_tenant_sla_policies for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_sla_insert_ops on public.erp_tenant_sla_policies;
create policy erp_tenant_sla_insert_ops on public.erp_tenant_sla_policies for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_sla_update_ops on public.erp_tenant_sla_policies;
create policy erp_tenant_sla_update_ops on public.erp_tenant_sla_policies for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_sla_delete_ops on public.erp_tenant_sla_policies;
create policy erp_tenant_sla_delete_ops on public.erp_tenant_sla_policies for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

-- ─── Billing / conformité / analytics tenant-scoped / recovery / orchestration ─
create table if not exists public.erp_tenant_billing_accounts (
  tenant_id uuid primary key references public.erp_tenants(id) on delete cascade,
  billing_external_ref text null,
  currency_code text not null default 'GNF',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_tenant_billing_updated_at on public.erp_tenant_billing_accounts;
create trigger trg_erp_tenant_billing_updated_at
before update on public.erp_tenant_billing_accounts
for each row execute procedure public.set_updated_at();

alter table public.erp_tenant_billing_accounts enable row level security;

drop policy if exists erp_tenant_billing_select on public.erp_tenant_billing_accounts;
create policy erp_tenant_billing_select on public.erp_tenant_billing_accounts for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_billing_insert_ops on public.erp_tenant_billing_accounts;
create policy erp_tenant_billing_insert_ops on public.erp_tenant_billing_accounts for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_billing_update_ops on public.erp_tenant_billing_accounts;
create policy erp_tenant_billing_update_ops on public.erp_tenant_billing_accounts for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_billing_delete_ops on public.erp_tenant_billing_accounts;
create policy erp_tenant_billing_delete_ops on public.erp_tenant_billing_accounts for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

create table if not exists public.erp_tenant_compliance_profiles (
  tenant_id uuid primary key references public.erp_tenants(id) on delete cascade,
  isolation_profile_key text not null default 'standard',
  retention_policy_ref text null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_tenant_compliance_updated_at on public.erp_tenant_compliance_profiles;
create trigger trg_erp_tenant_compliance_updated_at
before update on public.erp_tenant_compliance_profiles
for each row execute procedure public.set_updated_at();

alter table public.erp_tenant_compliance_profiles enable row level security;

drop policy if exists erp_tenant_compliance_select on public.erp_tenant_compliance_profiles;
create policy erp_tenant_compliance_select on public.erp_tenant_compliance_profiles for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_compliance_insert_ops on public.erp_tenant_compliance_profiles;
create policy erp_tenant_compliance_insert_ops on public.erp_tenant_compliance_profiles for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_compliance_update_ops on public.erp_tenant_compliance_profiles;
create policy erp_tenant_compliance_update_ops on public.erp_tenant_compliance_profiles for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_compliance_delete_ops on public.erp_tenant_compliance_profiles;
create policy erp_tenant_compliance_delete_ops on public.erp_tenant_compliance_profiles for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

create table if not exists public.erp_tenant_analytics_snapshots (
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  scope_key text not null,
  payload jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  primary key (tenant_id, scope_key),
  constraint erp_tenant_analytics_scope_chk check (length(trim(scope_key)) > 0)
);

alter table public.erp_tenant_analytics_snapshots enable row level security;

drop policy if exists erp_tenant_analytics_select on public.erp_tenant_analytics_snapshots;
create policy erp_tenant_analytics_select on public.erp_tenant_analytics_snapshots for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_analytics_insert_ops on public.erp_tenant_analytics_snapshots;
create policy erp_tenant_analytics_insert_ops on public.erp_tenant_analytics_snapshots for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_analytics_update_ops on public.erp_tenant_analytics_snapshots;
create policy erp_tenant_analytics_update_ops on public.erp_tenant_analytics_snapshots for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_analytics_delete_ops on public.erp_tenant_analytics_snapshots;
create policy erp_tenant_analytics_delete_ops on public.erp_tenant_analytics_snapshots for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

create table if not exists public.erp_tenant_recovery_checkpoints (
  tenant_id uuid primary key references public.erp_tenants(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_tenant_recovery_updated_at on public.erp_tenant_recovery_checkpoints;
create trigger trg_erp_tenant_recovery_updated_at
before update on public.erp_tenant_recovery_checkpoints
for each row execute procedure public.set_updated_at();

alter table public.erp_tenant_recovery_checkpoints enable row level security;

drop policy if exists erp_tenant_recovery_select on public.erp_tenant_recovery_checkpoints;
create policy erp_tenant_recovery_select on public.erp_tenant_recovery_checkpoints for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_recovery_insert_ops on public.erp_tenant_recovery_checkpoints;
create policy erp_tenant_recovery_insert_ops on public.erp_tenant_recovery_checkpoints for insert to authenticated
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_recovery_update_ops on public.erp_tenant_recovery_checkpoints;
create policy erp_tenant_recovery_update_ops on public.erp_tenant_recovery_checkpoints for update to authenticated
using (public.is_super_admin() or public.is_multitenant_operator())
with check (public.is_super_admin() or public.is_multitenant_operator());

drop policy if exists erp_tenant_recovery_delete_ops on public.erp_tenant_recovery_checkpoints;
create policy erp_tenant_recovery_delete_ops on public.erp_tenant_recovery_checkpoints for delete to authenticated
using (public.is_super_admin() or public.is_multitenant_operator());

create table if not exists public.erp_tenant_orchestration_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint erp_tenant_orch_event_kind_chk check (length(trim(event_kind)) > 0)
);

create index if not exists idx_erp_tenant_orch_events_tenant_created
  on public.erp_tenant_orchestration_events (tenant_id, created_at desc);

alter table public.erp_tenant_orchestration_events enable row level security;

drop policy if exists erp_tenant_orch_select on public.erp_tenant_orchestration_events;
create policy erp_tenant_orch_select on public.erp_tenant_orchestration_events for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_multitenant_operator());

drop policy if exists erp_tenant_orch_insert on public.erp_tenant_orchestration_events;
create policy erp_tenant_orch_insert on public.erp_tenant_orchestration_events for insert to authenticated
with check (
  public.is_super_admin()
  or public.is_multitenant_operator()
);

-- ─── Plateforme : tenant par défaut + quotas seed ─────────────────────────────
insert into public.erp_tenants (id, slug, display_name, region_key, status, plan_key, metadata)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'default',
  'Organisation plateforme',
  'eu-west',
  'active',
  'enterprise',
  '{"kind":"platform_default"}'::jsonb
)
on conflict (id) do nothing;

insert into public.erp_tenant_quotas (tenant_id, quota_key, limit_value, period, metadata)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'infra.enqueue.daily',
  50000,
  'daily',
  '{"note":"Limite indicative jobs infra tenant-scoped"}'::jsonb
)
on conflict (tenant_id, quota_key) do nothing;

-- ─── Jobs infra : tenant_id optionnel ────────────────────────────────────────
alter table public.erp_infrastructure_jobs
  add column if not exists tenant_id uuid references public.erp_tenants(id) on delete set null;

create index if not exists idx_erp_infra_jobs_tenant_pending
  on public.erp_infrastructure_jobs (tenant_id, status)
  where tenant_id is not null;

drop policy if exists erp_infra_jobs_select_own on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_select_own on public.erp_infrastructure_jobs for select to authenticated
using (
  created_by = auth.uid()
  or public.is_super_admin()
  or (
    tenant_id is not null
    and exists (
      select 1
      from public.erp_tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = erp_infrastructure_jobs.tenant_id
    )
  )
);

drop policy if exists erp_infra_jobs_insert_self on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_insert_self on public.erp_infrastructure_jobs for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    tenant_id is null
    or public.is_super_admin()
    or exists (
      select 1
      from public.erp_tenant_memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = tenant_id
    )
  )
);

commit;
