-- 064_ops_project_domain_enterprise.sql
-- Domaine Operations + Project : tâches, workflows, projets, livraison — RLS module `operations`.

begin;

insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'operations', true, true, true, true, null),
  ('manager', 'operations', true, true, true, false, null),
  ('agent', 'operations', true, true, true, false, null),
  ('accountant', 'operations', false, true, false, false, null),
  ('auditor', 'operations', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.is_ops_operator()
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
        and upper(coalesce(p.department_key, '')) in ('CONSULTATION', 'ADMINISTRATION')
    );
$$;

grant execute on function public.is_ops_operator() to authenticated;

-- ─── Projets gouvernés
create table if not exists public.erp_ops_projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null,
  title text not null,
  description text null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'on_hold', 'completed', 'archived')),
  budget_reference text null,
  team_members jsonb not null default '[]'::jsonb,
  department_key text not null default 'CONSULTATION',
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_ops_projects_code unique (project_code)
);

drop trigger if exists trg_erp_ops_projects_updated_at on public.erp_ops_projects;
create trigger trg_erp_ops_projects_updated_at
before update on public.erp_ops_projects
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ops_projects_owner on public.erp_ops_projects(owner_user_id);
create index if not exists idx_erp_ops_projects_status on public.erp_ops_projects(status);

-- ─── Tâches
create table if not exists public.erp_ops_tasks (
  id uuid primary key default gen_random_uuid(),
  task_code text not null,
  title text not null,
  description text null,
  project_id uuid null references public.erp_ops_projects(id) on delete set null,
  status text not null default 'todo'
    check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  assignee_user_id uuid null references auth.users(id) on delete set null,
  due_at timestamptz null,
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id) on delete set null,
  depends_on_task_id uuid null references public.erp_ops_tasks(id) on delete set null,
  source_event_type text null,
  source_entity_type text null,
  source_entity_id uuid null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_ops_tasks_code unique (task_code)
);

drop trigger if exists trg_erp_ops_tasks_updated_at on public.erp_ops_tasks;
create trigger trg_erp_ops_tasks_updated_at
before update on public.erp_ops_tasks
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ops_tasks_project on public.erp_ops_tasks(project_id);
create index if not exists idx_erp_ops_tasks_assignee on public.erp_ops_tasks(assignee_user_id);
create index if not exists idx_erp_ops_tasks_status on public.erp_ops_tasks(status);

-- ─── Historique tâches
create table if not exists public.erp_ops_task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.erp_ops_tasks(id) on delete cascade,
  field_name text not null,
  old_value text null,
  new_value text null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_ops_task_history_task on public.erp_ops_task_history(task_id);

-- ─── Workflows
create table if not exists public.erp_ops_workflows (
  id uuid primary key default gen_random_uuid(),
  workflow_code text not null,
  subject_type text not null check (subject_type in ('project', 'task', 'delivery')),
  subject_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'review', 'approved', 'closed')),
  current_step_key text null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_ops_workflows_code unique (workflow_code)
);

drop trigger if exists trg_erp_ops_workflows_updated_at on public.erp_ops_workflows;
create trigger trg_erp_ops_workflows_updated_at
before update on public.erp_ops_workflows
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ops_workflows_subject on public.erp_ops_workflows(subject_type, subject_id);
create index if not exists idx_erp_ops_workflows_status on public.erp_ops_workflows(status);

create table if not exists public.erp_ops_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.erp_ops_workflows(id) on delete cascade,
  step_key text not null,
  step_order int not null default 0,
  label text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'done', 'skipped')),
  completed_at timestamptz null,
  completed_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uq_erp_ops_workflow_step unique (workflow_id, step_key)
);

create index if not exists idx_erp_ops_workflow_steps_wf on public.erp_ops_workflow_steps(workflow_id);

-- ─── Livraison / exécution
create table if not exists public.erp_ops_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_code text not null,
  project_id uuid not null references public.erp_ops_projects(id) on delete cascade,
  milestone_key text not null,
  milestone_label text not null,
  progress_pct numeric(5, 2) not null default 0 check (progress_pct >= 0 and progress_pct <= 100),
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'delayed', 'blocked')),
  executed_by uuid null references auth.users(id) on delete set null,
  due_at timestamptz null,
  completed_at timestamptz null,
  issue_notes text null,
  delay_reason text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_ops_deliveries_code unique (delivery_code)
);

drop trigger if exists trg_erp_ops_deliveries_updated_at on public.erp_ops_deliveries;
create trigger trg_erp_ops_deliveries_updated_at
before update on public.erp_ops_deliveries
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_ops_deliveries_project on public.erp_ops_deliveries(project_id);
create index if not exists idx_erp_ops_deliveries_status on public.erp_ops_deliveries(status);

-- ─── RLS
alter table public.erp_ops_projects enable row level security;
alter table public.erp_ops_tasks enable row level security;
alter table public.erp_ops_task_history enable row level security;
alter table public.erp_ops_workflows enable row level security;
alter table public.erp_ops_workflow_steps enable row level security;
alter table public.erp_ops_deliveries enable row level security;

drop policy if exists erp_ops_projects_select on public.erp_ops_projects;
create policy erp_ops_projects_select on public.erp_ops_projects for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_projects_insert on public.erp_ops_projects;
create policy erp_ops_projects_insert on public.erp_ops_projects for insert to authenticated
with check (
  public.user_has_module_permission('operations', 'create')
  and created_by = auth.uid()
);

drop policy if exists erp_ops_projects_update on public.erp_ops_projects;
create policy erp_ops_projects_update on public.erp_ops_projects for update to authenticated
using (public.user_has_module_permission('operations', 'update'))
with check (public.user_has_module_permission('operations', 'update'));

drop policy if exists erp_ops_tasks_select on public.erp_ops_tasks;
create policy erp_ops_tasks_select on public.erp_ops_tasks for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_tasks_insert on public.erp_ops_tasks;
create policy erp_ops_tasks_insert on public.erp_ops_tasks for insert to authenticated
with check (
  public.user_has_module_permission('operations', 'create')
  and created_by = auth.uid()
);

drop policy if exists erp_ops_tasks_update on public.erp_ops_tasks;
create policy erp_ops_tasks_update on public.erp_ops_tasks for update to authenticated
using (public.user_has_module_permission('operations', 'update'))
with check (public.user_has_module_permission('operations', 'update'));

drop policy if exists erp_ops_task_history_select on public.erp_ops_task_history;
create policy erp_ops_task_history_select on public.erp_ops_task_history for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_task_history_insert on public.erp_ops_task_history;
create policy erp_ops_task_history_insert on public.erp_ops_task_history for insert to authenticated
with check (public.user_has_module_permission('operations', 'create'));

drop policy if exists erp_ops_workflows_select on public.erp_ops_workflows;
create policy erp_ops_workflows_select on public.erp_ops_workflows for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_workflows_insert on public.erp_ops_workflows;
create policy erp_ops_workflows_insert on public.erp_ops_workflows for insert to authenticated
with check (
  public.user_has_module_permission('operations', 'create')
  and created_by = auth.uid()
);

drop policy if exists erp_ops_workflows_update on public.erp_ops_workflows;
create policy erp_ops_workflows_update on public.erp_ops_workflows for update to authenticated
using (public.user_has_module_permission('operations', 'update'))
with check (public.user_has_module_permission('operations', 'update'));

drop policy if exists erp_ops_workflow_steps_select on public.erp_ops_workflow_steps;
create policy erp_ops_workflow_steps_select on public.erp_ops_workflow_steps for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_workflow_steps_insert on public.erp_ops_workflow_steps;
create policy erp_ops_workflow_steps_insert on public.erp_ops_workflow_steps for insert to authenticated
with check (public.user_has_module_permission('operations', 'create'));

drop policy if exists erp_ops_workflow_steps_update on public.erp_ops_workflow_steps;
create policy erp_ops_workflow_steps_update on public.erp_ops_workflow_steps for update to authenticated
using (public.user_has_module_permission('operations', 'update'))
with check (public.user_has_module_permission('operations', 'update'));

drop policy if exists erp_ops_deliveries_select on public.erp_ops_deliveries;
create policy erp_ops_deliveries_select on public.erp_ops_deliveries for select to authenticated
using (public.user_has_module_permission('operations', 'read'));

drop policy if exists erp_ops_deliveries_insert on public.erp_ops_deliveries;
create policy erp_ops_deliveries_insert on public.erp_ops_deliveries for insert to authenticated
with check (
  public.user_has_module_permission('operations', 'create')
  and created_by = auth.uid()
);

drop policy if exists erp_ops_deliveries_update on public.erp_ops_deliveries;
create policy erp_ops_deliveries_update on public.erp_ops_deliveries for update to authenticated
using (public.user_has_module_permission('operations', 'update'))
with check (public.user_has_module_permission('operations', 'update'));

commit;
