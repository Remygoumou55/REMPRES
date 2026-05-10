-- 058_enterprise_governance_platform_maturity.sql
-- Gouvernance plateforme : ADR, board architecture, standards, dette technique,
-- snapshots maturité, journal ops append-only — dépend de 055 (`erp_tenants`, `user_can_access_tenant`).

begin;

-- ─── Permissions module governance_platform ────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'governance_platform', true, true, true, true, null),
  ('manager', 'governance_platform', true, true, true, false, null),
  ('agent', 'governance_platform', false, true, false, false, null),
  ('accountant', 'governance_platform', false, true, false, false, null),
  ('auditor', 'governance_platform', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_governance_platform_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('governance_platform', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_governance_platform_module_permission(text) to authenticated;

create or replace function public.is_governance_platform_operator()
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

grant execute on function public.is_governance_platform_operator() to authenticated;

-- ─── ADR (Architecture Decision Records) ────────────────────────────────────────
create table if not exists public.erp_governance_architecture_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  adr_key text not null,
  title text not null,
  decision_status text not null default 'proposed'
    check (decision_status in ('proposed', 'accepted', 'deprecated', 'superseded')),
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_gov_adr_key_chk check (length(trim(adr_key)) > 0),
  constraint erp_gov_adr_title_chk check (length(trim(title)) > 0)
);

drop trigger if exists trg_erp_governance_architecture_decisions_updated_at on public.erp_governance_architecture_decisions;
create trigger trg_erp_governance_architecture_decisions_updated_at
before update on public.erp_governance_architecture_decisions
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_gov_adr_key_global
  on public.erp_governance_architecture_decisions (lower(adr_key))
  where tenant_id is null;

create unique index if not exists uq_erp_gov_adr_key_tenant
  on public.erp_governance_architecture_decisions (tenant_id, lower(adr_key))
  where tenant_id is not null;

alter table public.erp_governance_architecture_decisions enable row level security;

drop policy if exists erp_gov_architecture_decisions_select on public.erp_governance_architecture_decisions;
create policy erp_gov_architecture_decisions_select on public.erp_governance_architecture_decisions for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is null
    and public.user_has_governance_platform_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_architecture_decisions_insert on public.erp_governance_architecture_decisions;
create policy erp_gov_architecture_decisions_insert on public.erp_governance_architecture_decisions for insert to authenticated
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('create')
  )
);

drop policy if exists erp_gov_architecture_decisions_update on public.erp_governance_architecture_decisions;
create policy erp_gov_architecture_decisions_update on public.erp_governance_architecture_decisions for update to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
)
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
);

drop policy if exists erp_gov_architecture_decisions_delete on public.erp_governance_architecture_decisions;
create policy erp_gov_architecture_decisions_delete on public.erp_governance_architecture_decisions for delete to authenticated
using (
  public.is_super_admin()
  or public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('delete')
  )
);

-- ─── Architecture Governance Board (backlog sujets) ─────────────────────────────
create table if not exists public.erp_governance_board_topics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  topic_key text not null,
  title text not null,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'accepted', 'parked')),
  priority int not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_gov_board_topic_key_chk check (length(trim(topic_key)) > 0),
  constraint erp_gov_board_title_chk check (length(trim(title)) > 0)
);

drop trigger if exists trg_erp_governance_board_topics_updated_at on public.erp_governance_board_topics;
create trigger trg_erp_governance_board_topics_updated_at
before update on public.erp_governance_board_topics
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_gov_board_topic_global
  on public.erp_governance_board_topics (lower(topic_key))
  where tenant_id is null;

create unique index if not exists uq_erp_gov_board_topic_tenant
  on public.erp_governance_board_topics (tenant_id, lower(topic_key))
  where tenant_id is not null;

alter table public.erp_governance_board_topics enable row level security;

drop policy if exists erp_gov_board_topics_select on public.erp_governance_board_topics;
create policy erp_gov_board_topics_select on public.erp_governance_board_topics for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is null
    and public.user_has_governance_platform_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_board_topics_insert on public.erp_governance_board_topics;
create policy erp_gov_board_topics_insert on public.erp_governance_board_topics for insert to authenticated
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('create')
  )
);

drop policy if exists erp_gov_board_topics_update on public.erp_governance_board_topics;
create policy erp_gov_board_topics_update on public.erp_governance_board_topics for update to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
)
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
);

drop policy if exists erp_gov_board_topics_delete on public.erp_governance_board_topics;
create policy erp_gov_board_topics_delete on public.erp_governance_board_topics for delete to authenticated
using (
  public.is_super_admin()
  or public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('delete')
  )
);

-- ─── Registre standards engineering ───────────────────────────────────────────────
create table if not exists public.erp_governance_standards_registry (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  standard_key text not null,
  title text not null,
  category text not null default 'engineering',
  enforcement_level text not null default 'advisory'
    check (enforcement_level in ('advisory', 'mandatory', 'certification')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_gov_std_key_chk check (length(trim(standard_key)) > 0),
  constraint erp_gov_std_title_chk check (length(trim(title)) > 0)
);

drop trigger if exists trg_erp_governance_standards_registry_updated_at on public.erp_governance_standards_registry;
create trigger trg_erp_governance_standards_registry_updated_at
before update on public.erp_governance_standards_registry
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_gov_std_global
  on public.erp_governance_standards_registry (lower(standard_key))
  where tenant_id is null;

create unique index if not exists uq_erp_gov_std_tenant
  on public.erp_governance_standards_registry (tenant_id, lower(standard_key))
  where tenant_id is not null;

alter table public.erp_governance_standards_registry enable row level security;

drop policy if exists erp_gov_standards_registry_select on public.erp_governance_standards_registry;
create policy erp_gov_standards_registry_select on public.erp_governance_standards_registry for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is null
    and public.user_has_governance_platform_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_standards_registry_mutate on public.erp_governance_standards_registry;
drop policy if exists erp_gov_standards_registry_insert on public.erp_governance_standards_registry;
create policy erp_gov_standards_registry_insert on public.erp_governance_standards_registry for insert to authenticated
with check (
  public.is_super_admin()
  or public.is_governance_platform_operator()
);

drop policy if exists erp_gov_standards_registry_update on public.erp_governance_standards_registry;
create policy erp_gov_standards_registry_update on public.erp_governance_standards_registry for update to authenticated
using (public.is_super_admin() or public.is_governance_platform_operator())
with check (public.is_super_admin() or public.is_governance_platform_operator());

drop policy if exists erp_gov_standards_registry_delete on public.erp_governance_standards_registry;
create policy erp_gov_standards_registry_delete on public.erp_governance_standards_registry for delete to authenticated
using (public.is_super_admin() or public.is_governance_platform_operator());

-- ─── Dette technique ──────────────────────────────────────────────────────────────
create table if not exists public.erp_governance_technical_debt_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  debt_key text not null,
  title text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'remediated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_gov_debt_key_chk check (length(trim(debt_key)) > 0),
  constraint erp_gov_debt_title_chk check (length(trim(title)) > 0)
);

drop trigger if exists trg_erp_governance_technical_debt_updated_at on public.erp_governance_technical_debt_entries;
create trigger trg_erp_governance_technical_debt_updated_at
before update on public.erp_governance_technical_debt_entries
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_gov_debt_global
  on public.erp_governance_technical_debt_entries (lower(debt_key))
  where tenant_id is null;

create unique index if not exists uq_erp_gov_debt_tenant
  on public.erp_governance_technical_debt_entries (tenant_id, lower(debt_key))
  where tenant_id is not null;

alter table public.erp_governance_technical_debt_entries enable row level security;

drop policy if exists erp_gov_technical_debt_select on public.erp_governance_technical_debt_entries;
create policy erp_gov_technical_debt_select on public.erp_governance_technical_debt_entries for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is null
    and public.user_has_governance_platform_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_technical_debt_insert on public.erp_governance_technical_debt_entries;
create policy erp_gov_technical_debt_insert on public.erp_governance_technical_debt_entries for insert to authenticated
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('create')
  )
);

drop policy if exists erp_gov_technical_debt_update on public.erp_governance_technical_debt_entries;
create policy erp_gov_technical_debt_update on public.erp_governance_technical_debt_entries for update to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
)
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
);

drop policy if exists erp_gov_technical_debt_delete on public.erp_governance_technical_debt_entries;
create policy erp_gov_technical_debt_delete on public.erp_governance_technical_debt_entries for delete to authenticated
using (
  public.is_super_admin()
  or public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('delete')
  )
);

-- ─── Snapshots maturité plateforme ───────────────────────────────────────────────
create table if not exists public.erp_governance_maturity_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete cascade,
  dimension_key text not null,
  score numeric not null,
  measured_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint erp_gov_maturity_dim_chk check (length(trim(dimension_key)) > 0),
  constraint erp_gov_maturity_score_chk check (score >= 0 and score <= 100)
);

create index if not exists idx_erp_gov_maturity_measured on public.erp_governance_maturity_snapshots (measured_at desc);

alter table public.erp_governance_maturity_snapshots enable row level security;

drop policy if exists erp_gov_maturity_snapshots_select on public.erp_governance_maturity_snapshots;
create policy erp_gov_maturity_snapshots_select on public.erp_governance_maturity_snapshots for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is null
    and public.user_has_governance_platform_module_permission('read')
  )
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_maturity_snapshots_insert on public.erp_governance_maturity_snapshots;
create policy erp_gov_maturity_snapshots_insert on public.erp_governance_maturity_snapshots for insert to authenticated
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('create')
  )
);

drop policy if exists erp_gov_maturity_snapshots_update on public.erp_governance_maturity_snapshots;
create policy erp_gov_maturity_snapshots_update on public.erp_governance_maturity_snapshots for update to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
)
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('update')
  )
);

drop policy if exists erp_gov_maturity_snapshots_delete on public.erp_governance_maturity_snapshots;
create policy erp_gov_maturity_snapshots_delete on public.erp_governance_maturity_snapshots for delete to authenticated
using (
  public.is_super_admin()
  or public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('delete')
  )
);

-- ─── Journal plateforme gouvernance (append-only) ────────────────────────────────
create table if not exists public.erp_governance_platform_operations_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.erp_tenants(id) on delete set null,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  correlation_id text null,
  created_at timestamptz not null default now(),
  constraint erp_gov_plat_ops_event_kind_chk check (length(trim(event_kind)) > 0)
);

create index if not exists idx_erp_gov_plat_ops_created on public.erp_governance_platform_operations_events (created_at desc);

create or replace function public.trg_erp_governance_platform_operations_events_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_governance_platform_operations_events: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_gov_plat_ops_no_mut on public.erp_governance_platform_operations_events;
create trigger trg_erp_gov_plat_ops_no_mut
before update or delete on public.erp_governance_platform_operations_events
for each row execute procedure public.trg_erp_governance_platform_operations_events_append_only();

alter table public.erp_governance_platform_operations_events enable row level security;

drop policy if exists erp_gov_plat_ops_select on public.erp_governance_platform_operations_events;
create policy erp_gov_plat_ops_select on public.erp_governance_platform_operations_events for select to authenticated
using (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('read')
  )
);

drop policy if exists erp_gov_plat_ops_insert on public.erp_governance_platform_operations_events;
create policy erp_gov_plat_ops_insert on public.erp_governance_platform_operations_events for insert to authenticated
with check (
  public.is_governance_platform_operator()
  or (
    tenant_id is not null
    and public.user_can_access_tenant(tenant_id)
    and public.user_has_governance_platform_module_permission('create')
  )
);

-- ─── Seeds légers ────────────────────────────────────────────────────────────────
insert into public.erp_governance_architecture_decisions (tenant_id, adr_key, title, decision_status, summary, metadata)
select null, 'ADR-GOV-0001', 'Base governance platform', 'accepted',
  'Socle ADR / board / standards / dette / maturité branché sur tenants et audit existants.',
  '{"phase":1}'::jsonb
where not exists (
  select 1 from public.erp_governance_architecture_decisions d
  where d.tenant_id is null and lower(d.adr_key) = lower('ADR-GOV-0001')
);

commit;
