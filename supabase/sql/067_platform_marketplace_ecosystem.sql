-- 067_platform_marketplace_ecosystem.sql
-- Bloc 3 Étape 8 — API governance, integration framework, connector engine, marketplace seeds.

begin;

-- ─── API Registry (gouvernance versions / rate limits / lifecycle)
create table if not exists public.erp_platform_api_registry (
  api_key text primary key,
  display_name text not null,
  version text not null default 'v1',
  auth_method text not null default 'session'
    check (auth_method in ('session', 'api_key', 'oauth2', 'mutual_tls')),
  rate_limit_per_minute int not null default 120 check (rate_limit_per_minute > 0),
  lifecycle_status text not null default 'active'
    check (lifecycle_status in ('draft', 'active', 'deprecated', 'retired')),
  owner_module text not null default 'platform',
  exposure_scope text not null default 'internal'
    check (exposure_scope in ('internal', 'partner', 'public')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_platform_api_key_chk check (length(trim(api_key)) > 0)
);

drop trigger if exists trg_erp_platform_api_registry_updated_at on public.erp_platform_api_registry;
create trigger trg_erp_platform_api_registry_updated_at
before update on public.erp_platform_api_registry
for each row execute procedure public.set_updated_at();

alter table public.erp_platform_api_registry enable row level security;

drop policy if exists erp_platform_api_registry_select on public.erp_platform_api_registry;
create policy erp_platform_api_registry_select on public.erp_platform_api_registry for select to authenticated
using (public.user_has_platform_module_permission('read') or public.is_platform_operator());

drop policy if exists erp_platform_api_registry_mutate on public.erp_platform_api_registry;
create policy erp_platform_api_registry_mutate on public.erp_platform_api_registry for all to authenticated
using (public.is_super_admin() or public.is_platform_operator())
with check (public.is_super_admin() or public.is_platform_operator());

-- ─── Integration definitions (framework catalog)
create table if not exists public.erp_platform_integration_definitions (
  integration_key text primary key,
  display_name text not null,
  category text not null
    check (category in ('banking', 'payment', 'email', 'calendar', 'cloud', 'third_party')),
  connector_plugin_key text null,
  manifest jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_platform_integration_def_updated_at on public.erp_platform_integration_definitions;
create trigger trg_erp_platform_integration_def_updated_at
before update on public.erp_platform_integration_definitions
for each row execute procedure public.set_updated_at();

alter table public.erp_platform_integration_definitions enable row level security;

drop policy if exists erp_platform_integration_def_select on public.erp_platform_integration_definitions;
create policy erp_platform_integration_def_select on public.erp_platform_integration_definitions for select to authenticated
using (public.user_has_platform_module_permission('read') or public.is_platform_operator());

-- ─── Connector instances (runtime state, credentials abstraction)
create table if not exists public.erp_platform_connector_instances (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.erp_tenants(id) on delete cascade,
  connector_key text not null,
  integration_key text not null references public.erp_platform_integration_definitions(integration_key),
  connection_state text not null default 'disconnected'
    check (connection_state in ('disconnected', 'connecting', 'connected', 'degraded', 'failed')),
  health_score int null check (health_score is null or (health_score >= 0 and health_score <= 100)),
  last_sync_at timestamptz null,
  retry_count int not null default 0 check (retry_count >= 0),
  credential_ref text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, connector_key),
  constraint erp_platform_connector_key_chk check (length(trim(connector_key)) > 0)
);

drop trigger if exists trg_erp_platform_connector_instances_updated_at on public.erp_platform_connector_instances;
create trigger trg_erp_platform_connector_instances_updated_at
before update on public.erp_platform_connector_instances
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_platform_connector_tenant on public.erp_platform_connector_instances(tenant_id);
create index if not exists idx_erp_platform_connector_state on public.erp_platform_connector_instances(connection_state);

alter table public.erp_platform_connector_instances enable row level security;

drop policy if exists erp_platform_connector_instances_select on public.erp_platform_connector_instances;
create policy erp_platform_connector_instances_select on public.erp_platform_connector_instances for select to authenticated
using (public.user_can_access_tenant(tenant_id) or public.is_platform_operator());

-- ─── Connector execution logs (observability)
create table if not exists public.erp_platform_connector_logs (
  id uuid primary key default gen_random_uuid(),
  connector_instance_id uuid not null references public.erp_platform_connector_instances(id) on delete cascade,
  outcome text not null check (outcome in ('success', 'retry', 'failure', 'health_probe')),
  latency_ms int null check (latency_ms is null or latency_ms >= 0),
  detail text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_platform_connector_logs_instance on public.erp_platform_connector_logs(connector_instance_id, created_at desc);

alter table public.erp_platform_connector_logs enable row level security;

drop policy if exists erp_platform_connector_logs_select on public.erp_platform_connector_logs;
create policy erp_platform_connector_logs_select on public.erp_platform_connector_logs for select to authenticated
using (
  public.is_platform_operator()
  or exists (
    select 1 from public.erp_platform_connector_instances ci
    where ci.id = connector_instance_id
      and public.user_can_access_tenant(ci.tenant_id)
  )
);

-- ─── API audit append-only
create table if not exists public.erp_platform_api_audit_log (
  id uuid primary key default gen_random_uuid(),
  api_key text not null,
  actor_user_id uuid null,
  http_method text not null default 'GET',
  route_pattern text not null,
  status_code int not null default 200,
  latency_ms int null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_platform_api_audit_key on public.erp_platform_api_audit_log(api_key, created_at desc);

create or replace function public.trg_erp_platform_api_audit_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'erp_platform_api_audit_log: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_platform_api_audit_no_mut on public.erp_platform_api_audit_log;
create trigger trg_erp_platform_api_audit_no_mut
before update or delete on public.erp_platform_api_audit_log
for each row execute procedure public.trg_erp_platform_api_audit_append_only();

alter table public.erp_platform_api_audit_log enable row level security;

drop policy if exists erp_platform_api_audit_select on public.erp_platform_api_audit_log;
create policy erp_platform_api_audit_select on public.erp_platform_api_audit_log for select to authenticated
using (public.user_has_platform_module_permission('read') or public.is_platform_operator());

-- ─── Seeds API registry
insert into public.erp_platform_api_registry (api_key, display_name, version, auth_method, rate_limit_per_minute, lifecycle_status, owner_module, exposure_scope, metadata)
values
  ('erp.events.read', 'Lecture bus événements', 'v1', 'session', 60, 'active', 'platform', 'internal', '{"surface":"/api/erp/observability/events"}'::jsonb),
  ('erp.finance.snapshot', 'Snapshot finance', 'v1', 'session', 30, 'active', 'finance', 'internal', '{"surface":"/api/finance/snapshot"}'::jsonb),
  ('erp.rh.export', 'Export RH', 'v1', 'session', 10, 'active', 'hr', 'internal', '{"surface":"/api/rh/export"}'::jsonb),
  ('erp.partner.webhook', 'Webhook partenaire', 'v1', 'api_key', 120, 'active', 'platform', 'partner', '{"surface":"outbox"}'::jsonb)
on conflict (api_key) do update
set display_name = excluded.display_name, version = excluded.version, updated_at = now();

-- ─── Seeds integrations
insert into public.erp_platform_integration_definitions (integration_key, display_name, category, connector_plugin_key, manifest, metadata)
values
  ('integration.banking.stub', 'Banque — connecteur', 'banking', 'rempres.connector.banking', '{"protocol":"rest","sandbox":true}'::jsonb, '{"bloc":3}'::jsonb),
  ('integration.payment.stub', 'Paiement — connecteur', 'payment', 'rempres.connector.payment', '{"protocol":"rest"}'::jsonb, '{}'::jsonb),
  ('integration.email.stub', 'Email transactionnel', 'email', 'rempres.connector.email', '{"provider":"smtp_stub"}'::jsonb, '{}'::jsonb),
  ('integration.calendar.stub', 'Calendrier', 'calendar', 'rempres.connector.calendar', '{"provider":"ical_stub"}'::jsonb, '{}'::jsonb),
  ('integration.cloud.stub', 'Cloud storage', 'cloud', 'rempres.connector.cloud', '{"provider":"s3_compatible_stub"}'::jsonb, '{}'::jsonb),
  ('integration.third_party.generic', 'Système tiers générique', 'third_party', 'rempres.connector.generic', '{"protocol":"webhook"}'::jsonb, '{}'::jsonb)
on conflict (integration_key) do update
set display_name = excluded.display_name, manifest = excluded.manifest, updated_at = now();

-- ─── Seeds marketplace catalog (plugins / connectors)
insert into public.erp_platform_catalog_plugins (plugin_key, display_name, kind, publisher_key, manifest, is_listed, risk_tier, metadata)
select v.plugin_key, v.display_name, v.kind, v.publisher_key, v.manifest, v.is_listed, v.risk_tier, v.metadata
from (
  values
    ('rempres.connector.banking'::text, 'Connecteur bancaire'::text, 'workflow_connector'::text, 'rempres'::text, '{"permissions":["read_accounts"],"version":"1.0"}'::jsonb, true, 'medium'::text, '{"integration":"banking"}'::jsonb),
    ('rempres.connector.payment', 'Connecteur paiement', 'workflow_connector', 'rempres', '{"permissions":["init_payment"]}'::jsonb, true, 'high', '{}'::jsonb),
    ('rempres.connector.email', 'Connecteur email', 'integration', 'rempres', '{"permissions":["send_email"]}'::jsonb, true, 'low', '{}'::jsonb),
    ('rempres.connector.calendar', 'Connecteur calendrier', 'integration', 'rempres', '{}'::jsonb, true, 'low', '{}'::jsonb),
    ('rempres.connector.cloud', 'Connecteur cloud', 'integration', 'rempres', '{}'::jsonb, true, 'medium', '{}'::jsonb),
    ('rempres.connector.generic', 'Connecteur générique', 'workflow_connector', 'rempres', '{}'::jsonb, true, 'medium', '{}'::jsonb),
    ('rempres.dev.sandbox', 'Sandbox développeur', 'sdk_bundle', 'rempres', '{"sdk_min":"1.0","sandbox":true}'::jsonb, true, 'low', '{"developer":true}'::jsonb)
) as v(plugin_key, display_name, kind, publisher_key, manifest, is_listed, risk_tier, metadata)
where not exists (
  select 1 from public.erp_platform_catalog_plugins c where lower(c.plugin_key) = lower(v.plugin_key)
);

commit;
