-- 053_enterprise_observability_risk_intelligence.sql
-- Observabilité avancée & intelligence risque : santé opérationnelle, anomalies,
-- incidents corrélés, traces légères — branché jobs infrastructure, compliance,
-- automation, gouvernance — sans moteur parallèle analytics core.

begin;

-- ─── Permissions module observability ────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'observability', true, true, true, true, null),
  ('manager', 'observability', true, true, true, false, null),
  ('agent', 'observability', false, true, false, false, null),
  ('accountant', 'observability', false, true, false, false, null),
  ('auditor', 'observability', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_observability_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('observability', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_observability_module_permission(text) to authenticated;

create or replace function public.is_observability_operator()
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
        and upper(coalesce(p.department_key, '')) in ('ADMINISTRATION', 'AUDIT')
    );
$$;

grant execute on function public.is_observability_operator() to authenticated;

-- ─── Snapshots santé (append-only, scoring 0–100) ───────────────────────────
create table if not exists public.erp_observability_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope_key text not null,
  health_score int not null check (health_score >= 0 and health_score <= 100),
  signal_breakdown jsonb not null default '{}'::jsonb,
  predictive_hint jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create index if not exists idx_erp_obs_health_scope_time
  on public.erp_observability_health_snapshots (scope_key, computed_at desc);

create or replace function public.trg_erp_obs_health_snapshots_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_observability_health_snapshots: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_obs_health_no_mut on public.erp_observability_health_snapshots;
create trigger trg_erp_obs_health_no_mut
before update or delete on public.erp_observability_health_snapshots
for each row execute procedure public.trg_erp_obs_health_snapshots_append_only();

-- ─── Incidents opérationnels (corrélation multi-sources, refs externes JSON) ─
create table if not exists public.erp_observability_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_key text not null,
  title text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'investigating', 'resolved', 'closed')),
  correlated_refs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_obs_incident_key unique (incident_key)
);

drop trigger if exists trg_erp_obs_incidents_updated_at on public.erp_observability_incidents;
create trigger trg_erp_obs_incidents_updated_at
before update on public.erp_observability_incidents
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_obs_incidents_status on public.erp_observability_incidents(status, created_at desc);

-- ─── Anomalies détectées ─────────────────────────────────────────────────────
create table if not exists public.erp_observability_anomalies (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  domain_key text not null default 'global',
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  entity_type text null,
  entity_id text null,
  anomaly_score numeric(9, 4) not null default 0,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  incident_id uuid null references public.erp_observability_incidents(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists idx_erp_obs_anomalies_open on public.erp_observability_anomalies(status, detected_at desc);

create unique index if not exists uq_erp_obs_anomaly_open_dedupe
  on public.erp_observability_anomalies (
    rule_key,
    (coalesce(domain_key, '')),
    (coalesce(entity_type, '')),
    (coalesce(entity_id, ''))
  )
  where status = 'open';

-- ─── Trace events distribués (append-only, léger) ───────────────────────────
create table if not exists public.erp_observability_trace_events (
  id uuid primary key default gen_random_uuid(),
  trace_id uuid not null,
  parent_span_id uuid null,
  domain_key text not null,
  operation_key text not null,
  duration_ms int null check (duration_ms is null or duration_ms >= 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_obs_trace_trace on public.erp_observability_trace_events(trace_id, created_at desc);
create index if not exists idx_erp_obs_trace_domain on public.erp_observability_trace_events(domain_key, created_at desc);

create or replace function public.trg_erp_obs_trace_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_observability_trace_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_obs_trace_no_mut on public.erp_observability_trace_events;
create trigger trg_erp_obs_trace_no_mut
before update or delete on public.erp_observability_trace_events
for each row execute procedure public.trg_erp_obs_trace_events_append_only();

-- ─── Corrélations explicites (facettes incidents / signaux externes) ────────
create table if not exists public.erp_observability_correlations (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.erp_observability_incidents(id) on delete cascade,
  source_kind text not null,
  source_id text not null,
  weight numeric(9, 4) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint uq_erp_obs_corr_incident_source unique (incident_id, source_kind, source_id)
);

create index if not exists idx_erp_obs_corr_incident on public.erp_observability_correlations(incident_id);

-- ─── Predictions monitoring (append-only — préparation prédictive) ───────────
create table if not exists public.erp_observability_predictions (
  id uuid primary key default gen_random_uuid(),
  prediction_key text not null,
  horizon_hours int not null check (horizon_hours > 0 and horizon_hours <= 8760),
  scope_key text not null,
  projected_risk numeric(9, 4) not null default 0,
  rationale jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_obs_pred_scope on public.erp_observability_predictions(scope_key, created_at desc);

create or replace function public.trg_erp_obs_predictions_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_observability_predictions: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_obs_pred_no_mut on public.erp_observability_predictions;
create trigger trg_erp_obs_pred_no_mut
before update or delete on public.erp_observability_predictions
for each row execute procedure public.trg_erp_obs_predictions_append_only();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.erp_observability_health_snapshots enable row level security;
alter table public.erp_observability_incidents enable row level security;
alter table public.erp_observability_anomalies enable row level security;
alter table public.erp_observability_trace_events enable row level security;
alter table public.erp_observability_correlations enable row level security;
alter table public.erp_observability_predictions enable row level security;

drop policy if exists erp_obs_health_select on public.erp_observability_health_snapshots;
create policy erp_obs_health_select on public.erp_observability_health_snapshots for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_health_insert on public.erp_observability_health_snapshots;
create policy erp_obs_health_insert on public.erp_observability_health_snapshots for insert to authenticated
with check (
  public.user_has_observability_module_permission('create')
  and public.is_observability_operator()
);

drop policy if exists erp_obs_inc_select on public.erp_observability_incidents;
create policy erp_obs_inc_select on public.erp_observability_incidents for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_inc_mutate on public.erp_observability_incidents;
create policy erp_obs_inc_mutate on public.erp_observability_incidents for all to authenticated
using (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
)
with check (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
);

drop policy if exists erp_obs_anom_select on public.erp_observability_anomalies;
create policy erp_obs_anom_select on public.erp_observability_anomalies for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_anom_mutate on public.erp_observability_anomalies;
create policy erp_obs_anom_mutate on public.erp_observability_anomalies for all to authenticated
using (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
)
with check (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
);

drop policy if exists erp_obs_trace_select on public.erp_observability_trace_events;
create policy erp_obs_trace_select on public.erp_observability_trace_events for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_trace_insert on public.erp_observability_trace_events;
create policy erp_obs_trace_insert on public.erp_observability_trace_events for insert to authenticated
with check (
  public.user_has_observability_module_permission('create')
  and public.is_observability_operator()
);

drop policy if exists erp_obs_corr_select on public.erp_observability_correlations;
create policy erp_obs_corr_select on public.erp_observability_correlations for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_corr_mutate on public.erp_observability_correlations;
create policy erp_obs_corr_mutate on public.erp_observability_correlations for all to authenticated
using (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
)
with check (
  public.user_has_observability_module_permission('update')
  and public.is_observability_operator()
);

drop policy if exists erp_obs_pred_select on public.erp_observability_predictions;
create policy erp_obs_pred_select on public.erp_observability_predictions for select to authenticated
using (public.user_has_observability_module_permission('read'));

drop policy if exists erp_obs_pred_insert on public.erp_observability_predictions;
create policy erp_obs_pred_insert on public.erp_observability_predictions for insert to authenticated
with check (
  public.user_has_observability_module_permission('create')
  and public.is_observability_operator()
);

commit;
