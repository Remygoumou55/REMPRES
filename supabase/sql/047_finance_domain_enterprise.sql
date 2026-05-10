-- 047_finance_domain_enterprise.sql
-- Domaine Finance Enterprise : plan comptable, journal / grand livre, facturation AR,
-- paiements, budgets, cashflow quotidien — RLS alignée module `finance`,
-- gouvernance : FK optionnelle vers approval_requests, audit via governance_audit_events (app).

begin;

-- ─── Helper : opérateur Finance (équipe FINANCE ou admin) ───────────────────
create or replace function public.is_finance_operator()
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
        and upper(coalesce(p.department_key, '')) = 'FINANCE'
    );
$$;

grant execute on function public.is_finance_operator() to authenticated;

-- ─── Plan comptable ─────────────────────────────────────────────────────────
create table if not exists public.finance_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  account_type text not null
    check (account_type in ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id uuid null references public.finance_accounts(id) on delete set null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_finance_accounts_code unique (code)
);

drop trigger if exists trg_finance_accounts_updated_at on public.finance_accounts;
create trigger trg_finance_accounts_updated_at
before update on public.finance_accounts
for each row execute procedure public.set_updated_at();

create index if not exists idx_finance_accounts_type on public.finance_accounts(account_type);
create index if not exists idx_finance_accounts_parent on public.finance_accounts(parent_account_id);

-- ─── Lots / écritures (journal) ─────────────────────────────────────────────
create table if not exists public.finance_journal_batches (
  id uuid primary key default gen_random_uuid(),
  reference text not null default '',
  booking_date date not null default (timezone('utc', now()))::date,
  status text not null default 'draft'
    check (status in ('draft', 'posted', 'voided')),
  description text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  posted_at timestamptz null,
  posted_by uuid null references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_finance_journal_batches_updated_at on public.finance_journal_batches;
create trigger trg_finance_journal_batches_updated_at
before update on public.finance_journal_batches
for each row execute procedure public.set_updated_at();

create index if not exists idx_finance_journal_batches_booking on public.finance_journal_batches(booking_date desc);
create index if not exists idx_finance_journal_batches_status on public.finance_journal_batches(status);

create table if not exists public.finance_journal_lines (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.finance_journal_batches(id) on delete cascade,
  account_id uuid not null references public.finance_accounts(id) on delete restrict,
  debit_credit text not null check (debit_credit in ('D', 'C')),
  amount_gnf numeric(18, 2) not null check (amount_gnf > 0),
  memo text null,
  line_order int not null default 0,
  source_module text null,
  source_entity_type text null,
  source_entity_id text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_journal_lines_batch on public.finance_journal_lines(batch_id);
create index if not exists idx_finance_journal_lines_account on public.finance_journal_lines(account_id);

-- ─── Facturation ( créances ) ───────────────────────────────────────────────
create table if not exists public.finance_ar_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  client_id uuid null references public.clients(id) on delete set null,
  issue_date date not null,
  due_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'partially_paid', 'paid', 'voided', 'cancelled')),
  currency text not null default 'GNF'
    check (currency in ('GNF', 'XOF', 'USD', 'EUR')),
  total_gnf numeric(18, 2) not null default 0 check (total_gnf >= 0),
  notes text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_finance_ar_invoices_number unique (invoice_number)
);

drop trigger if exists trg_finance_ar_invoices_updated_at on public.finance_ar_invoices;
create trigger trg_finance_ar_invoices_updated_at
before update on public.finance_ar_invoices
for each row execute procedure public.set_updated_at();

create index if not exists idx_finance_ar_invoices_client on public.finance_ar_invoices(client_id);
create index if not exists idx_finance_ar_invoices_status on public.finance_ar_invoices(status);

create table if not exists public.finance_ar_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.finance_ar_invoices(id) on delete cascade,
  description text not null,
  quantity numeric(18, 4) not null default 1 check (quantity >= 0),
  unit_price_gnf numeric(18, 2) not null check (unit_price_gnf >= 0),
  tax_rate_percent numeric(9, 4) not null default 0 check (tax_rate_percent >= 0),
  line_total_gnf numeric(18, 2) not null default 0 check (line_total_gnf >= 0),
  line_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_ar_invoice_lines_inv on public.finance_ar_invoice_lines(invoice_id);

-- ─── Paiements / allocations ────────────────────────────────────────────────
create table if not exists public.finance_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  paid_at timestamptz not null default now(),
  amount_gnf numeric(18, 2) not null check (amount_gnf > 0),
  payment_method text not null default 'bank_transfer'
    check (payment_method in ('cash', 'mobile_money', 'bank_transfer', 'card', 'other')),
  reference text null,
  financial_transaction_id uuid null references public.financial_transactions(id) on delete set null,
  invoice_id uuid null references public.finance_ar_invoices(id) on delete set null,
  expense_id uuid null references public.expenses(id) on delete set null,
  notes text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint chk_finance_payment_single_target check (
    (case when financial_transaction_id is not null then 1 else 0 end)
    + (case when invoice_id is not null then 1 else 0 end)
    + (case when expense_id is not null then 1 else 0 end)
    <= 1
  )
);

create index if not exists idx_finance_payment_alloc_paid on public.finance_payment_allocations(paid_at desc);
create index if not exists idx_finance_payment_alloc_inv on public.finance_payment_allocations(invoice_id);

-- ─── Budgets ─────────────────────────────────────────────────────────────────
create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fiscal_year int not null check (fiscal_year >= 2000 and fiscal_year <= 2100),
  department_key text null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed')),
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_finance_budgets_year_name unique (fiscal_year, name)
);

drop trigger if exists trg_finance_budgets_updated_at on public.finance_budgets;
create trigger trg_finance_budgets_updated_at
before update on public.finance_budgets
for each row execute procedure public.set_updated_at();

create table if not exists public.finance_budget_lines (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.finance_budgets(id) on delete cascade,
  expense_category_id uuid null references public.expense_categories(id) on delete set null,
  account_id uuid null references public.finance_accounts(id) on delete set null,
  period_start date not null,
  period_end date not null,
  planned_amount_gnf numeric(18, 2) not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  constraint chk_finance_budget_period check (period_end >= period_start),
  constraint chk_finance_budget_axis check (expense_category_id is not null or account_id is not null)
);

create index if not exists idx_finance_budget_lines_budget on public.finance_budget_lines(budget_id);

-- ─── Cashflow / trésorerie (snapshot journalier) ────────────────────────────
create table if not exists public.finance_cashflow_daily (
  snapshot_date date primary key,
  opening_balance_gnf numeric(18, 2) not null default 0,
  inflow_gnf numeric(18, 2) not null default 0,
  outflow_gnf numeric(18, 2) not null default 0,
  closing_balance_gnf numeric(18, 2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

-- ─── Triggers intégrité journal ─────────────────────────────────────────────
create or replace function public.trg_finance_journal_batches_immutable_posted()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'posted' and new.status is distinct from 'posted' then
    raise exception 'finance_journal_batches: posted batch cannot change status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_fin_journal_batches_immutable on public.finance_journal_batches;
create trigger trg_fin_journal_batches_immutable
before update on public.finance_journal_batches
for each row execute procedure public.trg_finance_journal_batches_immutable_posted();

create or replace function public.trg_finance_journal_lines_guard_posted()
returns trigger
language plpgsql
as $$
declare
  st text;
begin
  select b.status into st
  from public.finance_journal_batches b
  where b.id = coalesce(new.batch_id, old.batch_id);

  if st = 'posted' then
    raise exception 'finance_journal_lines: cannot mutate lines of posted batch';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_fin_journal_lines_guard on public.finance_journal_lines;
create trigger trg_fin_journal_lines_guard
before insert or update or delete on public.finance_journal_lines
for each row execute procedure public.trg_finance_journal_lines_guard_posted();

-- ─── RPC : poster un lot équilibré ──────────────────────────────────────────
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
begin
  if not public.user_has_module_permission('finance', 'update') then
    raise exception 'post_finance_journal_batch: forbidden';
  end if;

  select status into v_status from public.finance_journal_batches where id = p_batch_id;
  if v_status is null then
    raise exception 'post_finance_journal_batch: batch not found';
  end if;
  if v_status <> 'draft' then
    raise exception 'post_finance_journal_batch: only draft batches can be posted';
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

-- ─── RPC : recalcul cashflow journalier (service / cron) ─────────────────────
create or replace function public.refresh_finance_cashflow_daily(p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_open numeric(18, 2) := 0;
  v_in numeric(18, 2);
  v_out numeric(18, 2);
  v_close numeric(18, 2);
  v_prev date := p_date - 1;
begin
  select closing_balance_gnf into v_open
  from public.finance_cashflow_daily
  where snapshot_date = v_prev;

  if v_open is null then
    v_open := 0;
  end if;

  select coalesce(sum(amount_paid_gnf), 0) into v_in
  from public.financial_transactions
  where (paid_at is not null and (paid_at at time zone 'utc')::date = p_date)
     or (paid_at is null and status = 'paid' and (created_at at time zone 'utc')::date = p_date);

  select coalesce(sum(amount_gnf), 0) into v_out
  from public.expenses
  where deleted_at is null
    and (expense_date = p_date);

  v_close := v_open + coalesce(v_in, 0) - coalesce(v_out, 0);

  insert into public.finance_cashflow_daily (
    snapshot_date,
    opening_balance_gnf,
    inflow_gnf,
    outflow_gnf,
    closing_balance_gnf,
    metadata,
    computed_at
  )
  values (
    p_date,
    v_open,
    coalesce(v_in, 0),
    coalesce(v_out, 0),
    v_close,
    jsonb_build_object('source', 'refresh_finance_cashflow_daily', 'version', 1),
    now()
  )
  on conflict (snapshot_date) do update
  set
    opening_balance_gnf = excluded.opening_balance_gnf,
    inflow_gnf = excluded.inflow_gnf,
    outflow_gnf = excluded.outflow_gnf,
    closing_balance_gnf = excluded.closing_balance_gnf,
    metadata = excluded.metadata,
    computed_at = excluded.computed_at;
end;
$$;

revoke all on function public.refresh_finance_cashflow_daily(date) from public;
grant execute on function public.refresh_finance_cashflow_daily(date) to service_role;

-- ─── Ligne facture : total ligne ────────────────────────────────────────────
create or replace function public.trg_finance_invoice_line_compute_total()
returns trigger
language plpgsql
as $$
declare
  v_net numeric(18, 2);
begin
  v_net := round(new.quantity * new.unit_price_gnf, 2);
  new.line_total_gnf := round(v_net * (1 + new.tax_rate_percent / 100.0), 2);
  return new;
end;
$$;

drop trigger if exists trg_fin_ar_inv_line_total on public.finance_ar_invoice_lines;
create trigger trg_fin_ar_inv_line_total
before insert or update on public.finance_ar_invoice_lines
for each row execute procedure public.trg_finance_invoice_line_compute_total();

create or replace function public.trg_finance_invoice_rollup_total()
returns trigger
language plpgsql
as $$
declare
  v_inv uuid;
begin
  v_inv := coalesce(new.invoice_id, old.invoice_id);
  update public.finance_ar_invoices i
  set
    total_gnf = coalesce((
      select sum(l.line_total_gnf)
      from public.finance_ar_invoice_lines l
      where l.invoice_id = v_inv
    ), 0),
    updated_at = now()
  where i.id = v_inv;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_fin_ar_inv_rollup on public.finance_ar_invoice_lines;
create trigger trg_fin_ar_inv_rollup
after insert or update or delete on public.finance_ar_invoice_lines
for each row execute procedure public.trg_finance_invoice_rollup_total();

-- ─── Vues reporting (grand livre / balance) ─────────────────────────────────
create or replace view public.v_finance_general_ledger as
select
  jl.id as line_id,
  jb.id as batch_id,
  jb.booking_date,
  jb.reference as batch_reference,
  jb.status as batch_status,
  jl.account_id,
  fa.code as account_code,
  fa.label as account_label,
  jl.debit_credit,
  jl.amount_gnf,
  jl.memo,
  jl.source_module,
  jl.source_entity_type,
  jl.source_entity_id,
  jb.posted_at,
  jl.created_at as line_created_at
from public.finance_journal_lines jl
join public.finance_journal_batches jb on jb.id = jl.batch_id
join public.finance_accounts fa on fa.id = jl.account_id
where jb.status = 'posted';

comment on view public.v_finance_general_ledger is 'Grand livre — écritures postées uniquement.';

create or replace view public.v_finance_trial_balance as
select
  jl.account_id,
  fa.code as account_code,
  fa.label as account_label,
  fa.account_type,
  sum(case when jl.debit_credit = 'D' then jl.amount_gnf else 0 end) as debit_total_gnf,
  sum(case when jl.debit_credit = 'C' then jl.amount_gnf else 0 end) as credit_total_gnf
from public.finance_journal_lines jl
join public.finance_journal_batches jb on jb.id = jl.batch_id and jb.status = 'posted'
join public.finance_accounts fa on fa.id = jl.account_id
group by jl.account_id, fa.code, fa.label, fa.account_type;

comment on view public.v_finance_trial_balance is 'Balance générale synthétique (écritures postées).';

-- ─── RLS (module finance, même pattern que dépenses) ─────────────────────────
alter table public.finance_accounts enable row level security;
alter table public.finance_journal_batches enable row level security;
alter table public.finance_journal_lines enable row level security;
alter table public.finance_ar_invoices enable row level security;
alter table public.finance_ar_invoice_lines enable row level security;
alter table public.finance_payment_allocations enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_budget_lines enable row level security;
alter table public.finance_cashflow_daily enable row level security;

-- finance_accounts
drop policy if exists finance_accounts_select on public.finance_accounts;
create policy finance_accounts_select on public.finance_accounts for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_accounts_insert on public.finance_accounts;
create policy finance_accounts_insert on public.finance_accounts for insert to authenticated
with check (
  public.user_has_module_permission('finance', 'create')
  and public.is_finance_operator()
);

drop policy if exists finance_accounts_update on public.finance_accounts;
create policy finance_accounts_update on public.finance_accounts for update to authenticated
using (public.user_has_module_permission('finance', 'update') and public.is_finance_operator())
with check (public.user_has_module_permission('finance', 'update') and public.is_finance_operator());

-- journal batches
drop policy if exists finance_journal_batches_select on public.finance_journal_batches;
create policy finance_journal_batches_select on public.finance_journal_batches for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_journal_batches_insert on public.finance_journal_batches;
create policy finance_journal_batches_insert on public.finance_journal_batches for insert to authenticated
with check (
  public.user_has_module_permission('finance', 'create')
  and created_by = auth.uid()
);

drop policy if exists finance_journal_batches_update on public.finance_journal_batches;
create policy finance_journal_batches_update on public.finance_journal_batches for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

-- journal lines
drop policy if exists finance_journal_lines_select on public.finance_journal_lines;
create policy finance_journal_lines_select on public.finance_journal_lines for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_journal_lines_insert on public.finance_journal_lines;
create policy finance_journal_lines_insert on public.finance_journal_lines for insert to authenticated
with check (public.user_has_module_permission('finance', 'create'));

drop policy if exists finance_journal_lines_update on public.finance_journal_lines;
create policy finance_journal_lines_update on public.finance_journal_lines for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

drop policy if exists finance_journal_lines_delete on public.finance_journal_lines;
create policy finance_journal_lines_delete on public.finance_journal_lines for delete to authenticated
using (public.user_has_module_permission('finance', 'update'));

-- AR invoices
drop policy if exists finance_ar_invoices_select on public.finance_ar_invoices;
create policy finance_ar_invoices_select on public.finance_ar_invoices for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_ar_invoices_insert on public.finance_ar_invoices;
create policy finance_ar_invoices_insert on public.finance_ar_invoices for insert to authenticated
with check (
  public.user_has_module_permission('finance', 'create')
  and created_by = auth.uid()
);

drop policy if exists finance_ar_invoices_update on public.finance_ar_invoices;
create policy finance_ar_invoices_update on public.finance_ar_invoices for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

-- AR invoice lines
drop policy if exists finance_ar_invoice_lines_select on public.finance_ar_invoice_lines;
create policy finance_ar_invoice_lines_select on public.finance_ar_invoice_lines for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_ar_invoice_lines_insert on public.finance_ar_invoice_lines;
create policy finance_ar_invoice_lines_insert on public.finance_ar_invoice_lines for insert to authenticated
with check (public.user_has_module_permission('finance', 'create'));

drop policy if exists finance_ar_invoice_lines_update on public.finance_ar_invoice_lines;
create policy finance_ar_invoice_lines_update on public.finance_ar_invoice_lines for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

drop policy if exists finance_ar_invoice_lines_delete on public.finance_ar_invoice_lines;
create policy finance_ar_invoice_lines_delete on public.finance_ar_invoice_lines for delete to authenticated
using (public.user_has_module_permission('finance', 'update'));

-- payments
drop policy if exists finance_payment_allocations_select on public.finance_payment_allocations;
create policy finance_payment_allocations_select on public.finance_payment_allocations for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_payment_allocations_insert on public.finance_payment_allocations;
create policy finance_payment_allocations_insert on public.finance_payment_allocations for insert to authenticated
with check (
  public.user_has_module_permission('finance', 'create')
  and created_by = auth.uid()
);

drop policy if exists finance_payment_allocations_update on public.finance_payment_allocations;
create policy finance_payment_allocations_update on public.finance_payment_allocations for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

-- budgets
drop policy if exists finance_budgets_select on public.finance_budgets;
create policy finance_budgets_select on public.finance_budgets for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_budgets_insert on public.finance_budgets;
create policy finance_budgets_insert on public.finance_budgets for insert to authenticated
with check (
  public.user_has_module_permission('finance', 'create')
  and created_by = auth.uid()
);

drop policy if exists finance_budgets_update on public.finance_budgets;
create policy finance_budgets_update on public.finance_budgets for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

drop policy if exists finance_budget_lines_select on public.finance_budget_lines;
create policy finance_budget_lines_select on public.finance_budget_lines for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

drop policy if exists finance_budget_lines_insert on public.finance_budget_lines;
create policy finance_budget_lines_insert on public.finance_budget_lines for insert to authenticated
with check (public.user_has_module_permission('finance', 'create'));

drop policy if exists finance_budget_lines_update on public.finance_budget_lines;
create policy finance_budget_lines_update on public.finance_budget_lines for update to authenticated
using (public.user_has_module_permission('finance', 'update'))
with check (public.user_has_module_permission('finance', 'update'));

drop policy if exists finance_budget_lines_delete on public.finance_budget_lines;
create policy finance_budget_lines_delete on public.finance_budget_lines for delete to authenticated
using (public.user_has_module_permission('finance', 'update'));

-- cashflow snapshots : lecture finance read ; écriture via RPC service_role uniquement
drop policy if exists finance_cashflow_daily_select on public.finance_cashflow_daily;
create policy finance_cashflow_daily_select on public.finance_cashflow_daily for select to authenticated
using (public.user_has_module_permission('finance', 'read'));

-- ─── Seed plan comptable minimal (idempotent) ───────────────────────────────
insert into public.finance_accounts (code, label, account_type, sort_order)
values
  ('531000', 'Caisse', 'asset', 10),
  ('512000', 'Banque', 'asset', 20),
  ('411000', 'Clients', 'asset', 30),
  ('401000', 'Fournisseurs', 'liability', 40),
  ('707000', 'Ventes de biens et prestations', 'revenue', 50),
  ('601000', 'Achats et charges externes', 'expense', 60),
  ('641000', 'Rémunérations du personnel', 'expense', 70)
on conflict (code) do nothing;

commit;
