-- 042_rh_employee_domain_completion.sql
-- Employee domain completion: documents, history, hierarchy (org-chart ready)

begin;

create table if not exists public.rh_employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text null,
  file_size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_rh_employee_documents_employee
  on public.rh_employee_documents(employee_id, created_at desc);

create table if not exists public.rh_employee_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_employee_history_employee
  on public.rh_employee_history(employee_id, created_at desc);

create table if not exists public.rh_employee_hierarchy (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete cascade,
  manager_id uuid null references auth.users(id) on delete set null,
  department_key text null,
  title text null,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

create index if not exists idx_rh_employee_hierarchy_manager
  on public.rh_employee_hierarchy(manager_id, active);

alter table public.rh_employee_documents enable row level security;
alter table public.rh_employee_history enable row level security;
alter table public.rh_employee_hierarchy enable row level security;

drop policy if exists rh_employee_documents_select on public.rh_employee_documents;
create policy rh_employee_documents_select
on public.rh_employee_documents
for select
to authenticated
using (
  employee_id = auth.uid()
  or public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
);

drop policy if exists rh_employee_documents_insert on public.rh_employee_documents;
create policy rh_employee_documents_insert
on public.rh_employee_documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    employee_id = auth.uid()
    or public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_employee_history_select on public.rh_employee_history;
create policy rh_employee_history_select
on public.rh_employee_history
for select
to authenticated
using (
  employee_id = auth.uid()
  or public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
);

drop policy if exists rh_employee_history_insert on public.rh_employee_history;
create policy rh_employee_history_insert
on public.rh_employee_history
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    employee_id = auth.uid()
    or public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_employee_hierarchy_select on public.rh_employee_hierarchy;
create policy rh_employee_hierarchy_select
on public.rh_employee_hierarchy
for select
to authenticated
using (
  employee_id = auth.uid()
  or manager_id = auth.uid()
  or public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
);

drop policy if exists rh_employee_hierarchy_insert on public.rh_employee_hierarchy;
create policy rh_employee_hierarchy_insert
on public.rh_employee_hierarchy
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_employee_hierarchy_update on public.rh_employee_hierarchy;
create policy rh_employee_hierarchy_update
on public.rh_employee_hierarchy
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

create or replace function public.touch_rh_employee_hierarchy_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_rh_employee_hierarchy_updated_at on public.rh_employee_hierarchy;
create trigger trg_touch_rh_employee_hierarchy_updated_at
before update on public.rh_employee_hierarchy
for each row
execute function public.touch_rh_employee_hierarchy_updated_at();

commit;

