-- 056_enterprise_platform_extensibility_marketplace.sql
-- Extensibilité ERP / marketplace : registre plugins, installations tenant-scoped,
-- connexions partenaires (métadonnées), outbox événements externes — branché tenants (055),
-- sans refactor auth ni domaines métier.

begin;

-- ─── Permissions module platform ─────────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'platform', true, true, true, true, null),
  ('manager', 'platform', true, true, true, false, null),
  ('agent', 'platform', false, true, false, false, null),
  ('accountant', 'platform', false, true, false, false, null),
  ('auditor', 'platform', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_platform_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('platform', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_platform_module_permission(text) to authenticated;

create or replace function public.is_platform_operator()
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

grant execute on function public.is_platform_operator() to authenticated;

-- ─── Catalogue marketplace (registre global) ─────────────────────────────────
create table if not exists public.erp_platform_catalog_plugins (
  id uuid primary key default gen_random_uuid(),
  plugin_key text not null,
  display_name text not null,
  kind text not null default 'plugin'
    check (kind in ('plugin', 'integration', 'workflow_connector', 'sdk_bundle')),
  publisher_key text not null default 'internal',
  manifest jsonb not null default '{}'::jsonb,
  is_listed boolean not null default true,
  risk_tier text not null default 'low'
    check (risk_tier in ('low', 'medium', 'high')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_platform_catalog_plugins_key_chk check (length(trim(plugin_key)) > 0),
  constraint erp_platform_catalog_plugins_name_chk check (length(trim(display_name)) > 0)
);

drop trigger if exists trg_erp_platform_catalog_plugins_updated_at on public.erp_platform_catalog_plugins;
create trigger trg_erp_platform_catalog_plugins_updated_at
before update on public.erp_platform_catalog_plugins
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_platform_catalog_plugins_key_lower
  on public.erp_platform_catalog_plugins (lower(plugin_key));

alter table public.erp_platform_catalog_plugins enable row level security;

drop policy if exists erp_platform_catalog_select on public.erp_platform_catalog_plugins;
create policy erp_platform_catalog_select on public.erp_platform_catalog_plugins for select to authenticated
using (
  public.user_has_platform_module_permission('read')
  or public.is_platform_operator()
);

drop policy if exists erp_platform_catalog_mutate_ops on public.erp_platform_catalog_plugins;
create policy erp_platform_catalog_mutate_ops on public.erp_platform_catalog_plugins for insert to authenticated
with check (public.is_super_admin() or public.is_platform_operator());

drop policy if exists erp_platform_catalog_update_ops on public.erp_platform_catalog_plugins;
create policy erp_platform_catalog_update_ops on public.erp_platform_catalog_plugins for update to authenticated
using (public.is_super_admin() or public.is_platform_operator())
with check (public.is_super_admin() or public.is_platform_operator());

drop policy if exists erp_platform_catalog_delete_ops on public.erp_platform_catalog_plugins;
create policy erp_platform_catalog_delete_ops on public.erp_platform_catalog_plugins for delete to authenticated
using (public.is_super_admin() or public.is_platform_operator());

-- ─── Installations par tenant ────────────────────────────────────────────────
create table if not exists public.erp_platform_plugin_installations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  plugin_id uuid not null references public.erp_platform_catalog_plugins(id) on delete restrict,
  installed_version text not null default '1.0.0',
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, plugin_id),
  constraint erp_platform_install_version_chk check (length(trim(installed_version)) > 0)
);

drop trigger if exists trg_erp_platform_installations_updated_at on public.erp_platform_plugin_installations;
create trigger trg_erp_platform_installations_updated_at
before update on public.erp_platform_plugin_installations
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_platform_installations_tenant on public.erp_platform_plugin_installations(tenant_id);

alter table public.erp_platform_plugin_installations enable row level security;

drop policy if exists erp_platform_installations_select on public.erp_platform_plugin_installations;
create policy erp_platform_installations_select on public.erp_platform_plugin_installations for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_platform_operator());

drop policy if exists erp_platform_installations_insert on public.erp_platform_plugin_installations;
create policy erp_platform_installations_insert on public.erp_platform_plugin_installations for insert to authenticated
with check (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('create')
  )
);

drop policy if exists erp_platform_installations_update on public.erp_platform_plugin_installations;
create policy erp_platform_installations_update on public.erp_platform_plugin_installations for update to authenticated
using (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('update')
  )
)
with check (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('update')
  )
);

drop policy if exists erp_platform_installations_delete on public.erp_platform_plugin_installations;
create policy erp_platform_installations_delete on public.erp_platform_plugin_installations for delete to authenticated
using (
  public.is_super_admin()
  or public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('delete')
  )
);

-- ─── Connexions partenaires (pas de secrets bruts — métadonnées / refs) ──────
create table if not exists public.erp_platform_partner_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  connection_key text not null,
  integration_kind text not null default 'api_oauth_stub'
    check (integration_kind in ('api_oauth_stub', 'webhook', 'exchange', 'custom')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, connection_key),
  constraint erp_platform_partner_conn_key_chk check (length(trim(connection_key)) > 0)
);

drop trigger if exists trg_erp_platform_partner_connections_updated_at on public.erp_platform_partner_connections;
create trigger trg_erp_platform_partner_connections_updated_at
before update on public.erp_platform_partner_connections
for each row execute procedure public.set_updated_at();

alter table public.erp_platform_partner_connections enable row level security;

drop policy if exists erp_platform_partner_select on public.erp_platform_partner_connections;
create policy erp_platform_partner_select on public.erp_platform_partner_connections for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_platform_operator());

drop policy if exists erp_platform_partner_insert on public.erp_platform_partner_connections;
create policy erp_platform_partner_insert on public.erp_platform_partner_connections for insert to authenticated
with check (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('create')
  )
);

drop policy if exists erp_platform_partner_update on public.erp_platform_partner_connections;
create policy erp_platform_partner_update on public.erp_platform_partner_connections for update to authenticated
using (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('update')
  )
)
with check (
  public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('update')
  )
);

drop policy if exists erp_platform_partner_delete on public.erp_platform_partner_connections;
create policy erp_platform_partner_delete on public.erp_platform_partner_connections for delete to authenticated
using (
  public.is_super_admin()
  or public.is_platform_operator()
  or (
    public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('delete')
  )
);

-- ─── Outbox événements externes (append-only) ───────────────────────────────
create table if not exists public.erp_platform_external_event_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete set null,
  topic_key text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  created_at timestamptz not null default now(),
  constraint erp_platform_outbox_topic_chk check (length(trim(topic_key)) > 0)
);

create index if not exists idx_erp_platform_outbox_tenant_created
  on public.erp_platform_external_event_outbox (tenant_id, created_at desc);

create index if not exists idx_erp_platform_outbox_topic_created
  on public.erp_platform_external_event_outbox (topic_key, created_at desc);

create or replace function public.trg_erp_platform_external_event_outbox_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_platform_external_event_outbox: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_platform_outbox_no_mut on public.erp_platform_external_event_outbox;
create trigger trg_erp_platform_outbox_no_mut
before update or delete on public.erp_platform_external_event_outbox
for each row execute procedure public.trg_erp_platform_external_event_outbox_append_only();

alter table public.erp_platform_external_event_outbox enable row level security;

drop policy if exists erp_platform_outbox_select on public.erp_platform_external_event_outbox;
create policy erp_platform_outbox_select on public.erp_platform_external_event_outbox for select to authenticated
using (
  public.is_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('read')
  )
);

drop policy if exists erp_platform_outbox_insert on public.erp_platform_external_event_outbox;
create policy erp_platform_outbox_insert on public.erp_platform_external_event_outbox for insert to authenticated
with check (
  public.is_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_platform_module_permission('create')
  )
);

-- ─── Seed catalogue interne ─────────────────────────────────────────────────
insert into public.erp_platform_catalog_plugins (
  plugin_key, display_name, kind, publisher_key, manifest, is_listed, risk_tier, metadata
)
select
  'rempres.platform.bridge',
  'Pont extensibilité plateforme',
  'sdk_bundle',
  'rempres',
  '{"sdk_min":"1.0","capabilities":["events","installations"]}'::jsonb,
  true,
  'low',
  '{"phase":1}'::jsonb
where not exists (
  select 1
  from public.erp_platform_catalog_plugins c
  where lower(c.plugin_key) = lower('rempres.platform.bridge')
);

commit;
