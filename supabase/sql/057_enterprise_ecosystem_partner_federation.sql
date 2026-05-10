-- 057_enterprise_ecosystem_partner_federation.sql
-- Écosystème partenaires global : registre partenaires, liens tenant, certifications,
-- SLA partenaires, routes connecteurs, journal fédération append-only — dépend de 055 (tenants).

begin;

-- ─── Permissions module ecosystem ────────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'ecosystem', true, true, true, true, null),
  ('manager', 'ecosystem', true, true, true, false, null),
  ('agent', 'ecosystem', false, true, false, false, null),
  ('accountant', 'ecosystem', false, true, false, false, null),
  ('auditor', 'ecosystem', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_ecosystem_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('ecosystem', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_ecosystem_module_permission(text) to authenticated;

create or replace function public.is_ecosystem_operator()
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

grant execute on function public.is_ecosystem_operator() to authenticated;

-- ─── Registre partenaires ────────────────────────────────────────────────────
create table if not exists public.erp_ecosystem_partners (
  id uuid primary key default gen_random_uuid(),
  partner_key text not null,
  display_name text not null,
  tier text not null default 'certified'
    check (tier in ('global', 'certified', 'premier')),
  status text not null default 'active'
    check (status in ('active', 'onboarding', 'suspended')),
  headquarters_region text not null default 'global',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_ecosystem_partners_key_chk check (length(trim(partner_key)) > 0),
  constraint erp_ecosystem_partners_name_chk check (length(trim(display_name)) > 0)
);

drop trigger if exists trg_erp_ecosystem_partners_updated_at on public.erp_ecosystem_partners;
create trigger trg_erp_ecosystem_partners_updated_at
before update on public.erp_ecosystem_partners
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_ecosystem_partners_key_lower
  on public.erp_ecosystem_partners (lower(partner_key));

alter table public.erp_ecosystem_partners enable row level security;

drop policy if exists erp_ecosystem_partners_select on public.erp_ecosystem_partners;
create policy erp_ecosystem_partners_select on public.erp_ecosystem_partners for select to authenticated
using (
  public.user_has_ecosystem_module_permission('read')
  or public.is_ecosystem_operator()
);

drop policy if exists erp_ecosystem_partners_insert on public.erp_ecosystem_partners;
create policy erp_ecosystem_partners_insert on public.erp_ecosystem_partners for insert to authenticated
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_partners_update on public.erp_ecosystem_partners;
create policy erp_ecosystem_partners_update on public.erp_ecosystem_partners for update to authenticated
using (public.is_super_admin() or public.is_ecosystem_operator())
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_partners_delete on public.erp_ecosystem_partners;
create policy erp_ecosystem_partners_delete on public.erp_ecosystem_partners for delete to authenticated
using (public.is_super_admin());

-- ─── Liens tenant ↔ partenaire ────────────────────────────────────────────────
create table if not exists public.erp_ecosystem_partner_tenant_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  partner_id uuid not null references public.erp_ecosystem_partners(id) on delete cascade,
  relationship_kind text not null default 'technology'
    check (relationship_kind in ('technology', 'reseller', 'integrator', 'strategic')),
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, partner_id)
);

drop trigger if exists trg_erp_ecosystem_partner_links_updated_at on public.erp_ecosystem_partner_tenant_links;
create trigger trg_erp_ecosystem_partner_links_updated_at
before update on public.erp_ecosystem_partner_tenant_links
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ecosystem_partner_links_partner on public.erp_ecosystem_partner_tenant_links(partner_id);

alter table public.erp_ecosystem_partner_tenant_links enable row level security;

drop policy if exists erp_ecosystem_partner_links_select on public.erp_ecosystem_partner_tenant_links;
create policy erp_ecosystem_partner_links_select on public.erp_ecosystem_partner_tenant_links for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_partner_links_insert on public.erp_ecosystem_partner_tenant_links;
create policy erp_ecosystem_partner_links_insert on public.erp_ecosystem_partner_tenant_links for insert to authenticated
with check (
  public.is_ecosystem_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('create')
  )
);

drop policy if exists erp_ecosystem_partner_links_update on public.erp_ecosystem_partner_tenant_links;
create policy erp_ecosystem_partner_links_update on public.erp_ecosystem_partner_tenant_links for update to authenticated
using (
  public.is_ecosystem_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('update')
  )
)
with check (
  public.is_ecosystem_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('update')
  )
);

drop policy if exists erp_ecosystem_partner_links_delete on public.erp_ecosystem_partner_tenant_links;
create policy erp_ecosystem_partner_links_delete on public.erp_ecosystem_partner_tenant_links for delete to authenticated
using (
  public.is_super_admin()
  or public.is_ecosystem_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('delete')
  )
);

-- ─── Certifications intégrations ─────────────────────────────────────────────
create table if not exists public.erp_ecosystem_certifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.erp_ecosystem_partners(id) on delete cascade,
  certification_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'certified', 'revoked', 'expired')),
  issued_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, certification_key),
  constraint erp_ecosystem_cert_key_chk check (length(trim(certification_key)) > 0)
);

drop trigger if exists trg_erp_ecosystem_certifications_updated_at on public.erp_ecosystem_certifications;
create trigger trg_erp_ecosystem_certifications_updated_at
before update on public.erp_ecosystem_certifications
for each row execute procedure public.set_updated_at();

alter table public.erp_ecosystem_certifications enable row level security;

drop policy if exists erp_ecosystem_certifications_select on public.erp_ecosystem_certifications;
create policy erp_ecosystem_certifications_select on public.erp_ecosystem_certifications for select to authenticated
using (
  public.user_has_ecosystem_module_permission('read')
  or public.is_ecosystem_operator()
);

drop policy if exists erp_ecosystem_certifications_insert on public.erp_ecosystem_certifications;
create policy erp_ecosystem_certifications_insert on public.erp_ecosystem_certifications for insert to authenticated
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_certifications_update on public.erp_ecosystem_certifications;
create policy erp_ecosystem_certifications_update on public.erp_ecosystem_certifications for update to authenticated
using (public.is_super_admin() or public.is_ecosystem_operator())
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_certifications_delete on public.erp_ecosystem_certifications;
create policy erp_ecosystem_certifications_delete on public.erp_ecosystem_certifications for delete to authenticated
using (public.is_super_admin() or public.is_ecosystem_operator());

-- ─── SLA partenaires ─────────────────────────────────────────────────────────
create table if not exists public.erp_ecosystem_partner_sla_policies (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.erp_ecosystem_partners(id) on delete cascade,
  policy_key text not null,
  target_availability_pct numeric(5, 2) not null default 99.5
    check (target_availability_pct >= 0 and target_availability_pct <= 100),
  measurement_window_hours int not null default 720 check (measurement_window_hours > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, policy_key),
  constraint erp_ecosystem_sla_key_chk check (length(trim(policy_key)) > 0)
);

drop trigger if exists trg_erp_ecosystem_partner_sla_updated_at on public.erp_ecosystem_partner_sla_policies;
create trigger trg_erp_ecosystem_partner_sla_updated_at
before update on public.erp_ecosystem_partner_sla_policies
for each row execute procedure public.set_updated_at();

alter table public.erp_ecosystem_partner_sla_policies enable row level security;

drop policy if exists erp_ecosystem_sla_select on public.erp_ecosystem_partner_sla_policies;
create policy erp_ecosystem_sla_select on public.erp_ecosystem_partner_sla_policies for select to authenticated
using (
  public.user_has_ecosystem_module_permission('read')
  or public.is_ecosystem_operator()
);

drop policy if exists erp_ecosystem_sla_insert on public.erp_ecosystem_partner_sla_policies;
create policy erp_ecosystem_sla_insert on public.erp_ecosystem_partner_sla_policies for insert to authenticated
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_sla_update on public.erp_ecosystem_partner_sla_policies;
create policy erp_ecosystem_sla_update on public.erp_ecosystem_partner_sla_policies for update to authenticated
using (public.is_super_admin() or public.is_ecosystem_operator())
with check (public.is_super_admin() or public.is_ecosystem_operator());

drop policy if exists erp_ecosystem_sla_delete on public.erp_ecosystem_partner_sla_policies;
create policy erp_ecosystem_sla_delete on public.erp_ecosystem_partner_sla_policies for delete to authenticated
using (public.is_super_admin() or public.is_ecosystem_operator());

-- ─── Routage connecteurs (tenant optionnel = routes globales) ─────────────────
create table if not exists public.erp_ecosystem_connector_routes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  connector_key text not null,
  route_key text not null,
  priority int not null default 100,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_ecosystem_connector_key_chk check (length(trim(connector_key)) > 0),
  constraint erp_ecosystem_route_key_chk check (length(trim(route_key)) > 0)
);

drop trigger if exists trg_erp_ecosystem_connector_routes_updated_at on public.erp_ecosystem_connector_routes;
create trigger trg_erp_ecosystem_connector_routes_updated_at
before update on public.erp_ecosystem_connector_routes
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_ecosystem_connector_routes_global
  on public.erp_ecosystem_connector_routes (route_key)
  where tenant_id is null;

create unique index if not exists uq_erp_ecosystem_connector_routes_tenant
  on public.erp_ecosystem_connector_routes (tenant_id, route_key)
  where tenant_id is not null;

create index if not exists idx_erp_ecosystem_connector_routes_tenant on public.erp_ecosystem_connector_routes(tenant_id);

alter table public.erp_ecosystem_connector_routes enable row level security;

drop policy if exists erp_ecosystem_routes_select on public.erp_ecosystem_connector_routes;
create policy erp_ecosystem_routes_select on public.erp_ecosystem_connector_routes for select to authenticated
using (
  public.is_ecosystem_operator()
  or (
    tenant_id is null
    and public.user_has_ecosystem_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('read')
  )
);

drop policy if exists erp_ecosystem_routes_insert on public.erp_ecosystem_connector_routes;
create policy erp_ecosystem_routes_insert on public.erp_ecosystem_connector_routes for insert to authenticated
with check (
  public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('create')
  )
);

drop policy if exists erp_ecosystem_routes_update on public.erp_ecosystem_connector_routes;
create policy erp_ecosystem_routes_update on public.erp_ecosystem_connector_routes for update to authenticated
using (
  public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('update')
  )
)
with check (
  public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('update')
  )
);

drop policy if exists erp_ecosystem_routes_delete on public.erp_ecosystem_connector_routes;
create policy erp_ecosystem_routes_delete on public.erp_ecosystem_connector_routes for delete to authenticated
using (
  public.is_super_admin()
  or public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('delete')
  )
);

-- ─── Journal fédération (append-only) ───────────────────────────────────────
create table if not exists public.erp_ecosystem_federation_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete set null,
  partner_id uuid references public.erp_ecosystem_partners(id) on delete set null,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  created_at timestamptz not null default now(),
  constraint erp_ecosystem_fed_event_kind_chk check (length(trim(event_kind)) > 0)
);

create index if not exists idx_erp_ecosystem_federation_created on public.erp_ecosystem_federation_events (created_at desc);

create or replace function public.trg_erp_ecosystem_federation_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_ecosystem_federation_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_ecosystem_federation_no_mut on public.erp_ecosystem_federation_events;
create trigger trg_erp_ecosystem_federation_no_mut
before update or delete on public.erp_ecosystem_federation_events
for each row execute procedure public.trg_erp_ecosystem_federation_events_append_only();

alter table public.erp_ecosystem_federation_events enable row level security;

drop policy if exists erp_ecosystem_federation_select on public.erp_ecosystem_federation_events;
create policy erp_ecosystem_federation_select on public.erp_ecosystem_federation_events for select to authenticated
using (
  public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('read')
  )
);

drop policy if exists erp_ecosystem_federation_insert on public.erp_ecosystem_federation_events;
create policy erp_ecosystem_federation_insert on public.erp_ecosystem_federation_events for insert to authenticated
with check (
  public.is_ecosystem_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_ecosystem_module_permission('create')
  )
);

-- ─── Seed partenaire plateforme ───────────────────────────────────────────────
insert into public.erp_ecosystem_partners (
  partner_key, display_name, tier, status, headquarters_region, metadata
)
select
  'rempres.core',
  'RemPres Core Network',
  'global',
  'active',
  'global',
  '{"role":"platform_anchor"}'::jsonb
where not exists (
  select 1
  from public.erp_ecosystem_partners p
  where lower(p.partner_key) = lower('rempres.core')
);

commit;
