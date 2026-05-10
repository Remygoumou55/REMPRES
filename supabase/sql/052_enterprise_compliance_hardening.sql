-- 052_enterprise_compliance_hardening.sql
-- Conformité entreprise : périodes comptables immuables, verrouillage fiscal,
-- rétention légale, traces hashées, signaux de risque, SoD (politiques),
-- snapshots compliance — intégration Finance (`post_finance_journal_batch`),
-- gouvernance existante, jobs infrastructure.

begin;

-- ─── Permissions module compliance ───────────────────────────────────────────
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'compliance', true, true, true, true, null),
  ('manager', 'compliance', true, true, true, false, null),
  ('agent', 'compliance', false, true, false, false, null),
  ('accountant', 'compliance', true, true, true, false, null),
  ('auditor', 'compliance', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

create or replace function public.user_has_compliance_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('compliance', action_name)
    or public.user_has_module_permission('admin', action_name);
$$;

grant execute on function public.user_has_compliance_module_permission(text) to authenticated;

create or replace function public.is_compliance_operator()
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
        and upper(coalesce(p.department_key, '')) in ('ADMINISTRATION', 'FINANCE')
    );
$$;

grant execute on function public.is_compliance_operator() to authenticated;

-- ─── Verrouillage fiscal annuel ──────────────────────────────────────────────
create table if not exists public.erp_compliance_fiscal_locks (
  legal_entity_key text not null default 'GROUP',
  fiscal_year int not null check (fiscal_year >= 2000 and fiscal_year <= 2100),
  journal_locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  locked_at timestamptz null,
  locked_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (legal_entity_key, fiscal_year)
);

drop trigger if exists trg_erp_compliance_fiscal_locks_updated_at on public.erp_compliance_fiscal_locks;
create trigger trg_erp_compliance_fiscal_locks_updated_at
before update on public.erp_compliance_fiscal_locks
for each row execute procedure public.set_updated_at();

-- ─── Périodes comptables (bornes inclusives) ─────────────────────────────────
create table if not exists public.erp_compliance_accounting_periods (
  id uuid primary key default gen_random_uuid(),
  legal_entity_key text not null default 'GROUP',
  label text not null default '',
  period_start date not null,
  period_end date not null,
  fiscal_year int not null check (fiscal_year >= 2000 and fiscal_year <= 2100),
  fiscal_month int null check (fiscal_month is null or (fiscal_month >= 1 and fiscal_month <= 12)),
  status text not null default 'open'
    check (status in ('open', 'closed', 'locked', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_erp_compliance_period_bounds check (period_end >= period_start),
  constraint uq_erp_compliance_period_start unique (legal_entity_key, period_start)
);

drop trigger if exists trg_erp_compliance_periods_updated_at on public.erp_compliance_accounting_periods;
create trigger trg_erp_compliance_periods_updated_at
before update on public.erp_compliance_accounting_periods
for each row execute procedure public.set_updated_at();

create index if not exists idx_erp_compliance_periods_range
  on public.erp_compliance_accounting_periods (legal_entity_key, period_start, period_end);
create index if not exists idx_erp_compliance_periods_status
  on public.erp_compliance_accounting_periods (legal_entity_key, status);

create or replace function public.trg_erp_compliance_periods_immutable()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status in ('locked', 'archived') then
      if new.status not in ('locked', 'archived') then
        raise exception 'erp_compliance_accounting_periods: locked/archived period cannot reopen';
      end if;
      if new.period_start is distinct from old.period_start
         or new.period_end is distinct from old.period_end
         or new.fiscal_year is distinct from old.fiscal_year then
        raise exception 'erp_compliance_accounting_periods: immutable fiscal bounds when locked';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then
    if old.status in ('locked', 'archived') then
      raise exception 'erp_compliance_accounting_periods: cannot delete locked/archived period';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_erp_compliance_periods_immutable on public.erp_compliance_accounting_periods;
create trigger trg_erp_compliance_periods_immutable
before update or delete on public.erp_compliance_accounting_periods
for each row execute procedure public.trg_erp_compliance_periods_immutable();

-- ─── Politiques de rétention ─────────────────────────────────────────────────
create table if not exists public.erp_compliance_retention_policies (
  id uuid primary key default gen_random_uuid(),
  domain_key text not null,
  retention_days int not null check (retention_days > 0 and retention_days <= 36500),
  legal_basis text not null default '',
  applies_to_entity_types text[] not null default '{}',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_erp_compliance_retention_domain unique (domain_key)
);

drop trigger if exists trg_erp_compliance_retention_updated_at on public.erp_compliance_retention_policies;
create trigger trg_erp_compliance_retention_updated_at
before update on public.erp_compliance_retention_policies
for each row execute procedure public.set_updated_at();

-- ─── Snapshots compliance (append-only) ──────────────────────────────────────
create table if not exists public.erp_compliance_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_key text not null,
  domain_key text not null,
  fiscal_year int null check (fiscal_year is null or (fiscal_year >= 2000 and fiscal_year <= 2100)),
  payload jsonb not null default '{}'::jsonb,
  content_hash text not null default '',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_compliance_snapshots_domain on public.erp_compliance_snapshots(domain_key, created_at desc);

create or replace function public.trg_erp_compliance_snapshots_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_compliance_snapshots: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_compliance_snapshots_no_mut on public.erp_compliance_snapshots;
create trigger trg_erp_compliance_snapshots_no_mut
before update or delete on public.erp_compliance_snapshots
for each row execute procedure public.trg_erp_compliance_snapshots_append_only();

-- ─── Signaux de risque ─────────────────────────────────────────────────────
create table if not exists public.erp_compliance_risk_signals (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  domain_key text not null default 'global',
  entity_type text null,
  entity_id text null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists idx_erp_compliance_risk_open on public.erp_compliance_risk_signals(status, detected_at desc);

create unique index if not exists uq_erp_compliance_risk_open_dedupe
  on public.erp_compliance_risk_signals (
    rule_key,
    (coalesce(entity_type, '')),
    (coalesce(entity_id, ''))
  )
  where status = 'open';

-- ─── Politiques séparation des fonctions (SoD) ───────────────────────────────
create table if not exists public.erp_compliance_sod_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  scope_module text not null,
  description text not null,
  forbidden_role_pairs jsonb not null default '[]'::jsonb,
  enforcement text not null default 'policy'
    check (enforcement in ('policy', 'blocking')),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_erp_compliance_sod_updated_at on public.erp_compliance_sod_rules;
create trigger trg_erp_compliance_sod_updated_at
before update on public.erp_compliance_sod_rules
for each row execute procedure public.set_updated_at();

-- ─── Traçabilité légale (chaîne hash simplifiée, append-only) ──────────────
create table if not exists public.erp_compliance_legal_traces (
  id uuid primary key default gen_random_uuid(),
  trace_key text not null,
  source_domain text not null,
  reference_table text not null,
  reference_id text not null,
  payload_hash text not null,
  previous_hash text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_compliance_legal_traces_ref
  on public.erp_compliance_legal_traces (reference_table, reference_id);
create index if not exists idx_erp_compliance_legal_traces_domain on public.erp_compliance_legal_traces(source_domain, created_at desc);

create or replace function public.trg_erp_compliance_legal_traces_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'erp_compliance_legal_traces: immutable append-only';
end;
$$;

drop trigger if exists trg_erp_compliance_legal_no_mut on public.erp_compliance_legal_traces;
create trigger trg_erp_compliance_legal_no_mut
before update or delete on public.erp_compliance_legal_traces
for each row execute procedure public.trg_erp_compliance_legal_traces_append_only();

-- ─── Manifestes export conformité ────────────────────────────────────────────
create table if not exists public.erp_compliance_export_manifests (
  id uuid primary key default gen_random_uuid(),
  export_kind text not null,
  domain_key text not null,
  idempotency_key text null,
  legal_hold boolean not null default false,
  requested_by uuid not null references auth.users(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_compliance_export_manifests_created on public.erp_compliance_export_manifests(created_at desc);

-- ─── Moteur fiscal / période : autorisation de poster le journal ────────────
create or replace function public.compliance_booking_date_permits_journal_post(p_booking_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    not exists (
      select 1
      from public.erp_compliance_fiscal_locks fl
      where fl.legal_entity_key = 'GROUP'
        and fl.fiscal_year = extract(year from p_booking_date)::int
        and fl.journal_locked = true
    )
    and not exists (
      select 1
      from public.erp_compliance_accounting_periods p
      where p.legal_entity_key = 'GROUP'
        and p.period_start <= p_booking_date
        and p.period_end >= p_booking_date
        and p.status in ('closed', 'locked', 'archived')
    );
$$;

grant execute on function public.compliance_booking_date_permits_journal_post(date) to authenticated;

-- ─── Intégration Finance : blocage post si verrou ────────────────────────────
create or replace function public.post_finance_journal_batch(p_batch_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deb numeric(18, 2);
  v_cred numeric(18, 2);
  v_status text;
  v_booking date;
begin
  if not public.user_has_module_permission('finance', 'update') then
    raise exception 'post_finance_journal_batch: forbidden';
  end if;

  select status, booking_date into v_status, v_booking
  from public.finance_journal_batches
  where id = p_batch_id;

  if v_status is null then
    raise exception 'post_finance_journal_batch: batch not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'post_finance_journal_batch: only draft batches can be posted';
  end if;

  if not public.compliance_booking_date_permits_journal_post(v_booking) then
    raise exception 'post_finance_journal_batch: compliance fiscal/period lock';
  end if;

  select
    coalesce(sum(case when debit_credit = 'D' then amount_gnf else 0 end), 0),
    coalesce(sum(case when debit_credit = 'C' then amount_gnf else 0 end), 0)
  into v_deb, v_cred
  from public.finance_journal_lines
  where batch_id = p_batch_id;

  if v_deb <= 0 then
    raise exception 'post_finance_journal_batch: empty batch';
  end if;
  if v_deb <> v_cred then
    raise exception 'post_finance_journal_batch: debits % and credits % must match', v_deb, v_cred;
  end if;

  update public.finance_journal_batches
  set
    status = 'posted',
    posted_at = now(),
    posted_by = auth.uid(),
    updated_at = now()
  where id = p_batch_id;
end;
$$;

revoke all on function public.post_finance_journal_batch(uuid) from public;
grant execute on function public.post_finance_journal_batch(uuid) to authenticated;

-- ─── Seeds minimaux ──────────────────────────────────────────────────────────
insert into public.erp_compliance_retention_policies (
  domain_key, retention_days, legal_basis, applies_to_entity_types, is_active
)
values
  ('finance', 2555, 'Conservation pièces et écritures comptables (réf. interne)', array['journal_batch', 'invoice'], true),
  ('rh', 1825, 'Conservation dossiers RH', array['employee', 'contract'], true),
  ('vente', 1825, 'Conservation documents vente', array['sale', 'client'], true)
on conflict (domain_key) do update
set
  retention_days = excluded.retention_days,
  legal_basis = excluded.legal_basis,
  applies_to_entity_types = excluded.applies_to_entity_types,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.erp_compliance_sod_rules (
  rule_key, scope_module, description, forbidden_role_pairs, enforcement, is_active
)
values (
  'finance.approve_and_post',
  'finance',
  'Le même profil ne doit pas créer et approuver puis poster sans contre-validation.',
  '[{"a":"agent","b":"accountant"}]'::jsonb,
  'policy',
  true
)
on conflict (rule_key) do update
set
  description = excluded.description,
  forbidden_role_pairs = excluded.forbidden_role_pairs,
  updated_at = now();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.erp_compliance_fiscal_locks enable row level security;
alter table public.erp_compliance_accounting_periods enable row level security;
alter table public.erp_compliance_retention_policies enable row level security;
alter table public.erp_compliance_snapshots enable row level security;
alter table public.erp_compliance_risk_signals enable row level security;
alter table public.erp_compliance_sod_rules enable row level security;
alter table public.erp_compliance_legal_traces enable row level security;
alter table public.erp_compliance_export_manifests enable row level security;

-- Fiscal locks
drop policy if exists erp_comp_fiscal_select on public.erp_compliance_fiscal_locks;
create policy erp_comp_fiscal_select on public.erp_compliance_fiscal_locks for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_fiscal_mutate on public.erp_compliance_fiscal_locks;
create policy erp_comp_fiscal_mutate on public.erp_compliance_fiscal_locks for all to authenticated
using (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
)
with check (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
);

-- Periods
drop policy if exists erp_comp_period_select on public.erp_compliance_accounting_periods;
create policy erp_comp_period_select on public.erp_compliance_accounting_periods for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_period_insert on public.erp_compliance_accounting_periods;
create policy erp_comp_period_insert on public.erp_compliance_accounting_periods for insert to authenticated
with check (
  public.user_has_compliance_module_permission('create')
  and public.is_compliance_operator()
  and created_by = auth.uid()
);

drop policy if exists erp_comp_period_update on public.erp_compliance_accounting_periods;
create policy erp_comp_period_update on public.erp_compliance_accounting_periods for update to authenticated
using (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
)
with check (public.user_has_compliance_module_permission('update'));

-- Retention
drop policy if exists erp_comp_ret_select on public.erp_compliance_retention_policies;
create policy erp_comp_ret_select on public.erp_compliance_retention_policies for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_ret_mutate on public.erp_compliance_retention_policies;
create policy erp_comp_ret_mutate on public.erp_compliance_retention_policies for all to authenticated
using (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
)
with check (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
);

-- Snapshots (insert operators)
drop policy if exists erp_comp_snap_select on public.erp_compliance_snapshots;
create policy erp_comp_snap_select on public.erp_compliance_snapshots for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_snap_insert on public.erp_compliance_snapshots;
create policy erp_comp_snap_insert on public.erp_compliance_snapshots for insert to authenticated
with check (
  public.user_has_compliance_module_permission('create')
  and public.is_compliance_operator()
);

-- Risk signals
drop policy if exists erp_comp_risk_select on public.erp_compliance_risk_signals;
create policy erp_comp_risk_select on public.erp_compliance_risk_signals for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_risk_mutate on public.erp_compliance_risk_signals;
create policy erp_comp_risk_mutate on public.erp_compliance_risk_signals for all to authenticated
using (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
)
with check (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
);

-- SoD rules (read all with module read; mutate operators)
drop policy if exists erp_comp_sod_select on public.erp_compliance_sod_rules;
create policy erp_comp_sod_select on public.erp_compliance_sod_rules for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_sod_mutate on public.erp_compliance_sod_rules;
create policy erp_comp_sod_mutate on public.erp_compliance_sod_rules for all to authenticated
using (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
)
with check (
  public.user_has_compliance_module_permission('update')
  and public.is_compliance_operator()
);

-- Legal traces
drop policy if exists erp_comp_legal_select on public.erp_compliance_legal_traces;
create policy erp_comp_legal_select on public.erp_compliance_legal_traces for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_legal_insert on public.erp_compliance_legal_traces;
create policy erp_comp_legal_insert on public.erp_compliance_legal_traces for insert to authenticated
with check (public.user_has_compliance_module_permission('create'));

-- Export manifests
drop policy if exists erp_comp_exp_select on public.erp_compliance_export_manifests;
create policy erp_comp_exp_select on public.erp_compliance_export_manifests for select to authenticated
using (public.user_has_compliance_module_permission('read'));

drop policy if exists erp_comp_exp_insert on public.erp_compliance_export_manifests;
create policy erp_comp_exp_insert on public.erp_compliance_export_manifests for insert to authenticated
with check (
  public.user_has_compliance_module_permission('create')
  and requested_by = auth.uid()
);

commit;
