-- 051_automation_engine.sql
-- Advanced Automation Engine : définitions de workflows, exécutions, bus d’événements,
-- planifications, SLA / escalades — intégré à `approval_requests`, `governance_alerts`,
-- et file globale `erp_infrastructure_jobs` (queue_key `automation`).

begin;

-- ─── Permissions module automation (FK → app_roles post-035)
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'automation', true, true, true, true, null),
  ('manager', 'automation', true, true, true, false, null),
  ('agent', 'automation', false, true, false, false, null),
  ('accountant', 'automation', false, true, false, false, null),
  ('auditor', 'automation', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_automation_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('automation', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_automation_module_permission(text) to authenticated;

create or replace function public.is_automation_operator()
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

grant execute on function public.is_automation_operator() to authenticated;

-- ─── Définitions de workflows (JSON steps métier versionné)
create table if not exists public.erp_automation_workflow_definitions (
  workflow_key text primary key,
  domain_key text not null,
  label text not null,
  description text null,
  definition jsonb not null default '{"steps":[]}'::jsonb,
  version int not null default 1 check (version >= 1),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_automation_wf_def_updated_at on public.erp_automation_workflow_definitions;
create trigger trg_erp_automation_wf_def_updated_at
before update on public.erp_automation_workflow_definitions
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_automation_wf_def_domain on public.erp_automation_workflow_definitions(domain_key);

-- ─── Politiques SLA par workflow
create table if not exists public.erp_automation_sla_policies (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null references public.erp_automation_workflow_definitions(workflow_key) on delete cascade,
  max_duration_minutes int not null check (max_duration_minutes > 0),
  escalate_department_key text null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_automation_sla_updated_at on public.erp_automation_sla_policies;
create trigger trg_erp_automation_sla_updated_at
before update on public.erp_automation_sla_policies
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_automation_sla_wf on public.erp_automation_sla_policies(workflow_key);

-- ─── Exécutions workflow
create table if not exists public.erp_automation_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null references public.erp_automation_workflow_definitions(workflow_key) on delete restrict,
  status text not null default 'pending'
    check (
      status in ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')
    ),
  context jsonb not null default '{}'::jsonb,
  current_step int not null default 0 check (current_step >= 0),
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  sla_deadline_at timestamptz null,
  escalated_at timestamptz null,
  last_error text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_automation_runs_updated_at on public.erp_automation_workflow_runs;
create trigger trg_erp_automation_runs_updated_at
before update on public.erp_automation_workflow_runs
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_automation_runs_status on public.erp_automation_workflow_runs(status, created_at desc);
create index if not exists idx_erp_automation_runs_sla on public.erp_automation_workflow_runs(sla_deadline_at)
  where status not in ('completed', 'failed', 'cancelled');

create or replace function public.erp_automation_run_apply_sla_deadline()
returns trigger
language plpgsql
as $$
declare
  v_minutes int;
begin
  if new.sla_deadline_at is null then
    select p.max_duration_minutes into v_minutes
    from public.erp_automation_sla_policies p
    where p.workflow_key = new.workflow_key
      and p.is_active
    order by p.max_duration_minutes asc
    limit 1;

    if v_minutes is not null then
      new.sla_deadline_at := now() + make_interval(mins => v_minutes);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_erp_automation_run_sla on public.erp_automation_workflow_runs;
create trigger trg_erp_automation_run_sla
before insert on public.erp_automation_workflow_runs
for each row execute procedure public.erp_automation_run_apply_sla_deadline();

-- ─── Escalades SLA (trace métier)
create table if not exists public.erp_automation_escalations (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid not null references public.erp_automation_workflow_runs(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'resolved')),
  escalation_level int not null default 1 check (escalation_level >= 1),
  governance_alert_id uuid null references public.governance_alerts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create unique index if not exists uq_erp_automation_esc_pending_run
  on public.erp_automation_escalations (workflow_run_id)
  where status = 'pending';

create index if not exists idx_erp_automation_esc_run on public.erp_automation_escalations(workflow_run_id);

-- ─── Bus événements métier (append)
create table if not exists public.erp_automation_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  domain_key text not null,
  aggregate_type text null,
  aggregate_id text null,
  correlation_id text null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_automation_events_domain on public.erp_automation_events(domain_key, created_at desc);
create index if not exists idx_erp_automation_events_corr on public.erp_automation_events(correlation_id);

-- ─── Planifications (next-run simple — cron expr informative)
create table if not exists public.erp_automation_schedules (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null references public.erp_automation_workflow_definitions(workflow_key) on delete cascade,
  cron_expression text null,
  timezone text not null default 'UTC',
  next_run_at timestamptz not null,
  payload_template jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_run_at timestamptz null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_automation_sched_updated_at on public.erp_automation_schedules;
create trigger trg_erp_automation_sched_updated_at
before update on public.erp_automation_schedules
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_automation_sched_next on public.erp_automation_schedules(next_run_at)
  where is_active;

-- ─── Seeds minimaux
insert into public.erp_automation_workflow_definitions (
  workflow_key, domain_key, label, description, definition, is_active
)
values (
  'demo_sync',
  'global',
  'Démonstration synchronisation',
  'Workflow noop pour valider exécution & SLA.',
  '{"steps":[{"type":"noop","label":"noop"},{"type":"audit_log","label":"trace"}]}'::jsonb,
  true
)
on conflict (workflow_key) do update
set
  label = excluded.label,
  description = excluded.description,
  definition = excluded.definition,
  is_active = true,
  updated_at = now();

insert into public.erp_automation_sla_policies (workflow_key, max_duration_minutes, escalate_department_key, is_active)
select 'demo_sync', 120, 'ADMINISTRATION', true
where not exists (
  select 1 from public.erp_automation_sla_policies p where p.workflow_key = 'demo_sync'
);

-- ─── RLS
alter table public.erp_automation_workflow_definitions enable row level security;
alter table public.erp_automation_sla_policies enable row level security;
alter table public.erp_automation_workflow_runs enable row level security;
alter table public.erp_automation_escalations enable row level security;
alter table public.erp_automation_events enable row level security;
alter table public.erp_automation_schedules enable row level security;

-- Definitions
drop policy if exists erp_auto_def_select on public.erp_automation_workflow_definitions;
create policy erp_auto_def_select on public.erp_automation_workflow_definitions for select to authenticated
using (
  public.user_has_automation_module_permission('read')
  and (
    is_active = true
    or public.is_automation_operator()
    or public.is_super_admin()
  )
);

drop policy if exists erp_auto_def_insert on public.erp_automation_workflow_definitions;
create policy erp_auto_def_insert on public.erp_automation_workflow_definitions for insert to authenticated
with check (
  public.user_has_automation_module_permission('create')
  and public.is_automation_operator()
);

drop policy if exists erp_auto_def_update on public.erp_automation_workflow_definitions;
create policy erp_auto_def_update on public.erp_automation_workflow_definitions for update to authenticated
using (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
)
with check (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
);

-- SLA policies
drop policy if exists erp_auto_sla_select on public.erp_automation_sla_policies;
create policy erp_auto_sla_select on public.erp_automation_sla_policies for select to authenticated
using (public.user_has_automation_module_permission('read'));

drop policy if exists erp_auto_sla_insert on public.erp_automation_sla_policies;
create policy erp_auto_sla_insert on public.erp_automation_sla_policies for insert to authenticated
with check (
  public.user_has_automation_module_permission('create')
  and public.is_automation_operator()
);

drop policy if exists erp_auto_sla_update on public.erp_automation_sla_policies;
create policy erp_auto_sla_update on public.erp_automation_sla_policies for update to authenticated
using (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
)
with check (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
);

-- Runs
drop policy if exists erp_auto_run_select on public.erp_automation_workflow_runs;
create policy erp_auto_run_select on public.erp_automation_workflow_runs for select to authenticated
using (
  public.user_has_automation_module_permission('read')
  and (
    created_by = auth.uid()
    or public.is_automation_operator()
    or public.is_super_admin()
  )
);

drop policy if exists erp_auto_run_insert on public.erp_automation_workflow_runs;
create policy erp_auto_run_insert on public.erp_automation_workflow_runs for insert to authenticated
with check (
  public.user_has_automation_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists erp_auto_run_update on public.erp_automation_workflow_runs;
create policy erp_auto_run_update on public.erp_automation_workflow_runs for update to authenticated
using (
  public.user_has_automation_module_permission('update')
  and (
    created_by = auth.uid()
    or public.is_automation_operator()
  )
)
with check (public.user_has_automation_module_permission('update'));

-- Escalations
drop policy if exists erp_auto_esc_select on public.erp_automation_escalations;
create policy erp_auto_esc_select on public.erp_automation_escalations for select to authenticated
using (public.user_has_automation_module_permission('read'));

drop policy if exists erp_auto_esc_insert on public.erp_automation_escalations;
create policy erp_auto_esc_insert on public.erp_automation_escalations for insert to authenticated
with check (
  public.user_has_automation_module_permission('create')
  and public.is_automation_operator()
);

drop policy if exists erp_auto_esc_update on public.erp_automation_escalations;
create policy erp_auto_esc_update on public.erp_automation_escalations for update to authenticated
using (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
)
with check (
  public.user_has_automation_module_permission('update')
  and public.is_automation_operator()
);

-- Events bus
drop policy if exists erp_auto_evt_select on public.erp_automation_events;
create policy erp_auto_evt_select on public.erp_automation_events for select to authenticated
using (public.user_has_automation_module_permission('read'));

drop policy if exists erp_auto_evt_insert on public.erp_automation_events;
create policy erp_auto_evt_insert on public.erp_automation_events for insert to authenticated
with check (public.user_has_automation_module_permission('create'));

-- Schedules
drop policy if exists erp_auto_sched_select on public.erp_automation_schedules;
create policy erp_auto_sched_select on public.erp_automation_schedules for select to authenticated
using (public.user_has_automation_module_permission('read'));

drop policy if exists erp_auto_sched_insert on public.erp_automation_schedules;
create policy erp_auto_sched_insert on public.erp_automation_schedules for insert to authenticated
with check (
  public.user_has_automation_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists erp_auto_sched_update on public.erp_automation_schedules;
create policy erp_auto_sched_update on public.erp_automation_schedules for update to authenticated
using (
  public.user_has_automation_module_permission('update')
  and (
    created_by = auth.uid()
    or public.is_automation_operator()
  )
)
with check (public.user_has_automation_module_permission('update'));

commit;
