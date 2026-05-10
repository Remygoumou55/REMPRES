-- 043_rh_contract_domain_enterprise.sql
-- Contract domain enterprise: contracts, workflow, docs, history, reporting-ready.

begin;

create table if not exists public.rh_employee_contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references auth.users(id) on delete cascade,
  contract_type text not null check (contract_type in ('cdi', 'cdd', 'internship', 'consulting', 'temporary')),
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'active', 'expired', 'terminated', 'renewal_due')),
  start_date date not null,
  end_date date null,
  salary_gnf numeric(18,2) null,
  title text null,
  renewal_window_days integer not null default 30 check (renewal_window_days >= 0 and renewal_window_days <= 365),
  notes text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rh_employee_contracts_dates_ck check (end_date is null or start_date <= end_date)
);

create index if not exists idx_rh_employee_contracts_employee
  on public.rh_employee_contracts(employee_id, start_date desc);

create index if not exists idx_rh_employee_contracts_status_end
  on public.rh_employee_contracts(status, end_date);

create table if not exists public.rh_contract_documents (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.rh_employee_contracts(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text null,
  file_size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_contract_documents_contract
  on public.rh_contract_documents(contract_id, created_at desc);

create table if not exists public.rh_contract_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.rh_employee_contracts(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_contract_history_contract
  on public.rh_contract_history(contract_id, created_at desc);

alter table public.rh_employee_contracts enable row level security;
alter table public.rh_contract_documents enable row level security;
alter table public.rh_contract_history enable row level security;

drop policy if exists rh_employee_contracts_select on public.rh_employee_contracts;
create policy rh_employee_contracts_select
on public.rh_employee_contracts
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

drop policy if exists rh_employee_contracts_insert on public.rh_employee_contracts;
create policy rh_employee_contracts_insert
on public.rh_employee_contracts
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

drop policy if exists rh_employee_contracts_update on public.rh_employee_contracts;
create policy rh_employee_contracts_update
on public.rh_employee_contracts
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

drop policy if exists rh_contract_documents_select on public.rh_contract_documents;
create policy rh_contract_documents_select
on public.rh_contract_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.rh_employee_contracts c
    where c.id = contract_id
      and (
        c.employee_id = auth.uid()
        or public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_contract_documents_insert on public.rh_contract_documents;
create policy rh_contract_documents_insert
on public.rh_contract_documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_contract_history_select on public.rh_contract_history;
create policy rh_contract_history_select
on public.rh_contract_history
for select
to authenticated
using (
  exists (
    select 1
    from public.rh_employee_contracts c
    where c.id = contract_id
      and (
        c.employee_id = auth.uid()
        or public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_contract_history_insert on public.rh_contract_history;
create policy rh_contract_history_insert
on public.rh_contract_history
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

create or replace function public.touch_rh_employee_contracts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_rh_employee_contracts_updated_at on public.rh_employee_contracts;
create trigger trg_touch_rh_employee_contracts_updated_at
before update on public.rh_employee_contracts
for each row
execute function public.touch_rh_employee_contracts_updated_at();

commit;

