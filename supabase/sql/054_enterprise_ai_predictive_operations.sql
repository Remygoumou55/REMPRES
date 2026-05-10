-- 054_enterprise_ai_predictive_operations.sql
-- Plateforme AI / ops prédictives : insights append-only, recommandations actionnables,
-- artefacts de prévision, journal assistant (audit), runs pipeline — branché observabilité,
-- conformité, automation, infrastructure — pipelines heuristiques remplaçables par modèles externes.

begin;

-- ─── Permissions module ai ───────────────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'ai', true, true, true, true, null),
  ('manager', 'ai', true, true, true, false, null),
  ('agent', 'ai', false, true, false, false, null),
  ('accountant', 'ai', false, true, false, false, null),
  ('auditor', 'ai', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_ai_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('ai', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_ai_module_permission(text) to authenticated;

create or replace function public.is_ai_operator()
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

grant execute on function public.is_ai_operator() to authenticated;

-- ─── Insights métier (append-only) ─────────────────────────────────────────
create table if not exists public.erp_ai_insights (
  id uuid primary key default gen_random_uuid(),
  insight_key text not null,
  domain_key text not null,
  title text not null,
  summary text not null,
  confidence numeric(5, 4) not null default 0.5 check (confidence >= 0 and confidence <= 1),
  signal_refs jsonb not null default '[]'::jsonb,
  pipeline_version text not null default 'heuristic_v1',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_ai_insights_domain on public.erp_ai_insights(domain_key, created_at desc);
create index if not exists idx_erp_ai_insights_key on public.erp_ai_insights(insight_key);

create or replace function public.trg_erp_ai_insights_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_ai_insights: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_ai_insights_no_mut on public.erp_ai_insights;
create trigger trg_erp_ai_insights_no_mut
before update or delete on public.erp_ai_insights
for each row execute procedure public.trg_erp_ai_insights_append_only();

-- ─── Recommandations actionnables ──────────────────────────────────────────
create table if not exists public.erp_ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  recommendation_key text not null,
  domain_key text not null,
  entity_type text null,
  entity_id text null,
  priority int not null default 5 check (priority >= 1 and priority <= 10),
  title text not null,
  action_hint text not null default '',
  rationale jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'applied', 'dismissed', 'expired')),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_ai_recommendations_updated_at on public.erp_ai_recommendations;
create trigger trg_erp_ai_recommendations_updated_at
before update on public.erp_ai_recommendations
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ai_rec_pending on public.erp_ai_recommendations(status, priority desc, created_at desc);

-- ─── Runs pipeline (append-only) ─────────────────────────────────────────────
create table if not exists public.erp_ai_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  pipeline_key text not null,
  scope_key text not null default 'global',
  status text not null check (status in ('completed', 'failed')),
  metrics jsonb not null default '{}'::jsonb,
  error_message text null,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now()
);

create index if not exists idx_erp_ai_pipeline_key_time on public.erp_ai_pipeline_runs(pipeline_key, started_at desc);

create or replace function public.trg_erp_ai_pipeline_runs_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_ai_pipeline_runs: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_ai_pipeline_no_mut on public.erp_ai_pipeline_runs;
create trigger trg_erp_ai_pipeline_no_mut
before update or delete on public.erp_ai_pipeline_runs
for each row execute procedure public.trg_erp_ai_pipeline_runs_append_only();

-- ─── Artefacts prévisionnels (séries synthétiques) ─────────────────────────────
create table if not exists public.erp_ai_forecast_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_key text not null,
  domain_key text not null,
  horizon_days int not null check (horizon_days > 0 and horizon_days <= 365),
  series_key text not null,
  forecast_points jsonb not null default '[]'::jsonb,
  method text not null default 'heuristic_v1',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_ai_forecast_domain on public.erp_ai_forecast_artifacts(domain_key, created_at desc);

create or replace function public.trg_erp_ai_forecast_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_ai_forecast_artifacts: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_ai_forecast_no_mut on public.erp_ai_forecast_artifacts;
create trigger trg_erp_ai_forecast_no_mut
before update or delete on public.erp_ai_forecast_artifacts
for each row execute procedure public.trg_erp_ai_forecast_append_only();

-- ─── Journal assistant (audit safety — append-only) ──────────────────────────
create table if not exists public.erp_ai_assistant_events (
  id uuid primary key default gen_random_uuid(),
  session_key text not null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  event_kind text not null check (event_kind in ('user_intent', 'assistant_reply', 'system')),
  payload jsonb not null default '{}'::jsonb,
  safety_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_ai_assistant_session on public.erp_ai_assistant_events(session_key, created_at desc);

create or replace function public.trg_erp_ai_assistant_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_ai_assistant_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_ai_assistant_no_mut on public.erp_ai_assistant_events;
create trigger trg_erp_ai_assistant_no_mut
before update or delete on public.erp_ai_assistant_events
for each row execute procedure public.trg_erp_ai_assistant_append_only();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.erp_ai_insights enable row level security;
alter table public.erp_ai_recommendations enable row level security;
alter table public.erp_ai_pipeline_runs enable row level security;
alter table public.erp_ai_forecast_artifacts enable row level security;
alter table public.erp_ai_assistant_events enable row level security;

drop policy if exists erp_ai_insights_select on public.erp_ai_insights;
create policy erp_ai_insights_select on public.erp_ai_insights for select to authenticated
using (public.user_has_ai_module_permission('read'));

drop policy if exists erp_ai_insights_insert on public.erp_ai_insights;
create policy erp_ai_insights_insert on public.erp_ai_insights for insert to authenticated
with check (
  public.user_has_ai_module_permission('create')
  and public.is_ai_operator()
);

drop policy if exists erp_ai_rec_select on public.erp_ai_recommendations;
create policy erp_ai_rec_select on public.erp_ai_recommendations for select to authenticated
using (public.user_has_ai_module_permission('read'));

drop policy if exists erp_ai_rec_mutate on public.erp_ai_recommendations;
create policy erp_ai_rec_mutate on public.erp_ai_recommendations for all to authenticated
using (
  public.user_has_ai_module_permission('update')
  and public.is_ai_operator()
)
with check (
  public.user_has_ai_module_permission('update')
  and public.is_ai_operator()
);

drop policy if exists erp_ai_pipeline_select on public.erp_ai_pipeline_runs;
create policy erp_ai_pipeline_select on public.erp_ai_pipeline_runs for select to authenticated
using (public.user_has_ai_module_permission('read'));

drop policy if exists erp_ai_pipeline_insert on public.erp_ai_pipeline_runs;
create policy erp_ai_pipeline_insert on public.erp_ai_pipeline_runs for insert to authenticated
with check (
  public.user_has_ai_module_permission('create')
  and public.is_ai_operator()
);

drop policy if exists erp_ai_forecast_select on public.erp_ai_forecast_artifacts;
create policy erp_ai_forecast_select on public.erp_ai_forecast_artifacts for select to authenticated
using (public.user_has_ai_module_permission('read'));

drop policy if exists erp_ai_forecast_insert on public.erp_ai_forecast_artifacts;
create policy erp_ai_forecast_insert on public.erp_ai_forecast_artifacts for insert to authenticated
with check (
  public.user_has_ai_module_permission('create')
  and public.is_ai_operator()
);

drop policy if exists erp_ai_assistant_select on public.erp_ai_assistant_events;
create policy erp_ai_assistant_select on public.erp_ai_assistant_events for select to authenticated
using (
  public.user_has_ai_module_permission('read')
  and (
    actor_user_id = auth.uid()
    or public.is_ai_operator()
    or public.is_super_admin()
  )
);

drop policy if exists erp_ai_assistant_insert on public.erp_ai_assistant_events;
create policy erp_ai_assistant_insert on public.erp_ai_assistant_events for insert to authenticated
with check (
  public.user_has_ai_module_permission('create')
  and (actor_user_id = auth.uid() or public.is_ai_operator())
);

commit;
