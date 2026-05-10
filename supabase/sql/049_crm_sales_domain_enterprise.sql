-- 049_crm_sales_domain_enterprise.sql
-- CRM / Sales Enterprise : leads, pipeline, opportunités, devis, activités, prévisions —
-- RLS alignée modules `crm` + compatibilité `vente`, liaison approvals / governance audit.

begin;

-- ─── Permissions module CRM (FK → app_roles, cf. 035)
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'crm', true, true, true, true, null),
  ('manager', 'crm', true, true, true, false, null),
  ('agent', 'crm', false, true, false, false, null),
  ('accountant', 'crm', false, true, false, false, null),
  ('auditor', 'crm', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

-- ─── CRM OU vente : même périmètre métier historique
create or replace function public.user_has_crm_module_permission(action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.user_has_module_permission('crm', action_name)
    or public.user_has_module_permission('vente', action_name);
$$;

grant execute on function public.user_has_crm_module_permission(text) to authenticated;

create or replace function public.is_crm_operator()
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
        and upper(coalesce(p.department_key, '')) = 'VENTE'
    );
$$;

grant execute on function public.is_crm_operator() to authenticated;

-- ─── Étapes pipeline (référentiel)
create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  probability_default int not null default 10
    check (probability_default >= 0 and probability_default <= 100),
  is_terminal_win boolean not null default false,
  is_terminal_loss boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_crm_pipeline_stages_code unique (code),
  constraint crm_pipeline_stages_terminal_chk check (
    not (is_terminal_win and is_terminal_loss)
  )
);

drop trigger if exists trg_crm_pipeline_stages_updated_at on public.crm_pipeline_stages;
create trigger trg_crm_pipeline_stages_updated_at
before update on public.crm_pipeline_stages
for each row execute procedure public.set_updated_at();

insert into public.crm_pipeline_stages (
  code, label, sort_order, probability_default, is_terminal_win, is_terminal_loss
)
values
  ('prospecting', 'Prospection', 10, 10, false, false),
  ('qualification', 'Qualification', 20, 25, false, false),
  ('proposal', 'Proposition', 30, 50, false, false),
  ('negotiation', 'Négociation', 40, 75, false, false),
  ('closed_won', 'Gagné', 100, 100, true, false),
  ('closed_lost', 'Perdu', 110, 0, false, true)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  probability_default = excluded.probability_default,
  is_terminal_win = excluded.is_terminal_win,
  is_terminal_loss = excluded.is_terminal_loss,
  is_active = true,
  updated_at = now();

-- ─── Leads
create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source text null,
  company_name text null,
  contact_first_name text null,
  contact_last_name text null,
  email text null,
  phone text null,
  estimated_value_gnf numeric(18, 2) not null default 0 check (estimated_value_gnf >= 0),
  currency text not null default 'GNF'
    check (currency in ('GNF', 'XOF', 'USD', 'EUR')),
  owner_id uuid null references auth.users(id) on delete set null,
  converted_client_id uuid null references public.clients(id) on delete set null,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  lost_reason text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

drop trigger if exists trg_crm_leads_updated_at on public.crm_leads;
create trigger trg_crm_leads_updated_at
before update on public.crm_leads
for each row execute procedure public.set_updated_at();

create index if not exists idx_crm_leads_status on public.crm_leads(status);
create index if not exists idx_crm_leads_owner on public.crm_leads(owner_id);
create index if not exists idx_crm_leads_created on public.crm_leads(created_at desc);

-- ─── Opportunités
create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid null references public.clients(id) on delete set null,
  lead_id uuid null references public.crm_leads(id) on delete set null,
  stage_id uuid not null references public.crm_pipeline_stages(id) on delete restrict,
  amount_estimated_gnf numeric(18, 2) not null default 0 check (amount_estimated_gnf >= 0),
  probability_pct int not null default 10 check (probability_pct >= 0 and probability_pct <= 100),
  expected_close_date date null,
  owner_id uuid null references auth.users(id) on delete set null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  lost_reason text null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

drop trigger if exists trg_crm_opportunities_updated_at on public.crm_opportunities;
create trigger trg_crm_opportunities_updated_at
before update on public.crm_opportunities
for each row execute procedure public.set_updated_at();

create index if not exists idx_crm_opp_stage on public.crm_opportunities(stage_id);
create index if not exists idx_crm_opp_client on public.crm_opportunities(client_id);
create index if not exists idx_crm_opp_owner on public.crm_opportunities(owner_id);

create or replace function public.crm_opportunity_apply_stage_probability()
returns trigger
language plpgsql
as $$
declare
  v_def int;
  v_apply boolean;
begin
  if TG_OP = 'INSERT' then
    v_apply := true;
  elsif TG_OP = 'UPDATE' then
    v_apply := new.stage_id is distinct from old.stage_id;
  else
    v_apply := false;
  end if;

  if v_apply then
    select s.probability_default into v_def
    from public.crm_pipeline_stages s
    where s.id = new.stage_id
    limit 1;

    if v_def is not null then
      new.probability_pct := v_def;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_crm_opp_stage_prob on public.crm_opportunities;
create trigger trg_crm_opp_stage_prob
before insert or update on public.crm_opportunities
for each row execute procedure public.crm_opportunity_apply_stage_probability();

-- ─── Devis
create table if not exists public.crm_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  opportunity_id uuid null references public.crm_opportunities(id) on delete set null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  valid_until date null,
  currency text not null default 'GNF'
    check (currency in ('GNF', 'XOF', 'USD', 'EUR')),
  total_amount_gnf numeric(18, 2) not null default 0 check (total_amount_gnf >= 0),
  notes text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  sale_id uuid null references public.sales(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint uq_crm_quotes_number unique (quote_number)
);

drop trigger if exists trg_crm_quotes_updated_at on public.crm_quotes;
create trigger trg_crm_quotes_updated_at
before update on public.crm_quotes
for each row execute procedure public.set_updated_at();

create index if not exists idx_crm_quotes_client on public.crm_quotes(client_id);
create index if not exists idx_crm_quotes_status on public.crm_quotes(status);

create or replace function public.generate_crm_quote_number()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) + 1
  into v_count
  from public.crm_quotes
  where extract(year from created_at) = extract(year from coalesce(new.created_at, now()));

  new.quote_number := 'DEV-' || to_char(coalesce(new.created_at, now()), 'YYYY') || '-' || lpad(v_count::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_crm_quotes_number on public.crm_quotes;
create trigger trg_crm_quotes_number
before insert on public.crm_quotes
for each row
when (new.quote_number is null or trim(new.quote_number) = '')
execute procedure public.generate_crm_quote_number();

create table if not exists public.crm_quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.crm_quotes(id) on delete cascade,
  line_order int not null default 0,
  product_id uuid null references public.products(id) on delete set null,
  description text not null default '',
  quantity numeric(18, 4) not null check (quantity > 0),
  unit_price_gnf numeric(18, 2) not null check (unit_price_gnf >= 0),
  line_total_gnf numeric(18, 2) not null check (line_total_gnf >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_quote_lines_quote on public.crm_quote_lines(quote_id);

create or replace function public.crm_quote_lines_refresh_total()
returns trigger
language plpgsql
as $$
declare
  v_quote uuid;
  v_sum numeric(18, 2);
begin
  v_quote := coalesce(new.quote_id, old.quote_id);

  select coalesce(sum(line_total_gnf), 0)
  into v_sum
  from public.crm_quote_lines
  where quote_id = v_quote;

  update public.crm_quotes
  set total_amount_gnf = v_sum,
      updated_at = now()
  where id = v_quote;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_crm_quote_lines_tot on public.crm_quote_lines;
create trigger trg_crm_quote_lines_tot
after insert or update or delete on public.crm_quote_lines
for each row execute procedure public.crm_quote_lines_refresh_total();

-- ─── Activités CRM
create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null
    check (activity_type in ('call', 'meeting', 'task', 'email', 'note')),
  subject text not null default '',
  body text null,
  due_at timestamptz null,
  completed_at timestamptz null,
  related_kind text not null
    check (related_kind in ('lead', 'opportunity', 'client', 'quote', 'sale')),
  related_id uuid not null,
  owner_id uuid null references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

drop trigger if exists trg_crm_activities_updated_at on public.crm_activities;
create trigger trg_crm_activities_updated_at
before update on public.crm_activities
for each row execute procedure public.set_updated_at();

create index if not exists idx_crm_act_related on public.crm_activities(related_kind, related_id);
create index if not exists idx_crm_act_owner_due on public.crm_activities(owner_id, due_at);

-- ─── Snapshots prévisionnels (agrégation batch / job applicatif)
create table if not exists public.crm_forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  grain text not null default 'monthly' check (grain in ('weekly', 'monthly')),
  owner_id uuid null references auth.users(id) on delete set null,
  pipeline_raw_gnf numeric(18, 2) not null default 0,
  weighted_pipeline_gnf numeric(18, 2) not null default 0,
  closed_won_gnf numeric(18, 2) not null default 0,
  computed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint uq_crm_forecast_period_owner unique (period_start, grain, owner_id)
);

create index if not exists idx_crm_forecast_period on public.crm_forecast_snapshots(period_start desc);

-- ─── Liaison commandes vente ↔ CRM
alter table public.sales
  add column if not exists crm_opportunity_id uuid null references public.crm_opportunities(id) on delete set null;

alter table public.sales
  add column if not exists crm_quote_id uuid null references public.crm_quotes(id) on delete set null;

create index if not exists idx_sales_crm_opp on public.sales(crm_opportunity_id);
create index if not exists idx_sales_crm_quote on public.sales(crm_quote_id);

-- ─── Vue pipeline pondéré (analytics)
create or replace view public.v_crm_pipeline_weighted as
select
  o.id as opportunity_id,
  o.title,
  o.amount_estimated_gnf,
  o.probability_pct,
  round(o.amount_estimated_gnf * o.probability_pct / 100.0, 2) as weighted_amount_gnf,
  s.code as stage_code,
  s.label as stage_label,
  o.expected_close_date,
  o.owner_id,
  o.client_id,
  o.created_at
from public.crm_opportunities o
join public.crm_pipeline_stages s on s.id = o.stage_id
where o.deleted_at is null
  and coalesce(s.is_terminal_loss, false) = false;

comment on view public.v_crm_pipeline_weighted is 'Montants pondérés opportunités ouvertes (exclut étapes « perdu »).';

-- ─── RLS
alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_opportunities enable row level security;
alter table public.crm_quotes enable row level security;
alter table public.crm_quote_lines enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_forecast_snapshots enable row level security;

-- Référentiel pipeline : lecture métier, écriture réservée super-admin (données seed)
drop policy if exists crm_stages_select on public.crm_pipeline_stages;
create policy crm_stages_select on public.crm_pipeline_stages for select to authenticated
using (public.user_has_crm_module_permission('read'));

drop policy if exists crm_stages_manage_super on public.crm_pipeline_stages;
create policy crm_stages_manage_super on public.crm_pipeline_stages for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Leads
drop policy if exists crm_leads_select on public.crm_leads;
create policy crm_leads_select on public.crm_leads for select to authenticated
using (public.user_has_crm_module_permission('read') and deleted_at is null);

drop policy if exists crm_leads_insert on public.crm_leads;
create policy crm_leads_insert on public.crm_leads for insert to authenticated
with check (
  public.user_has_crm_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists crm_leads_update on public.crm_leads;
create policy crm_leads_update on public.crm_leads for update to authenticated
using (
  public.user_has_crm_module_permission('update')
  and deleted_at is null
  and (
    owner_id = auth.uid()
    or created_by = auth.uid()
    or public.is_crm_operator()
  )
)
with check (public.user_has_crm_module_permission('update'));

-- Opportunités
drop policy if exists crm_opp_select on public.crm_opportunities;
create policy crm_opp_select on public.crm_opportunities for select to authenticated
using (public.user_has_crm_module_permission('read') and deleted_at is null);

drop policy if exists crm_opp_insert on public.crm_opportunities;
create policy crm_opp_insert on public.crm_opportunities for insert to authenticated
with check (
  public.user_has_crm_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists crm_opp_update on public.crm_opportunities;
create policy crm_opp_update on public.crm_opportunities for update to authenticated
using (
  public.user_has_crm_module_permission('update')
  and deleted_at is null
  and (
    owner_id = auth.uid()
    or created_by = auth.uid()
    or public.is_crm_operator()
  )
)
with check (public.user_has_crm_module_permission('update'));

-- Devis
drop policy if exists crm_quotes_select on public.crm_quotes;
create policy crm_quotes_select on public.crm_quotes for select to authenticated
using (public.user_has_crm_module_permission('read') and deleted_at is null);

drop policy if exists crm_quotes_insert on public.crm_quotes;
create policy crm_quotes_insert on public.crm_quotes for insert to authenticated
with check (
  public.user_has_crm_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists crm_quotes_update on public.crm_quotes;
create policy crm_quotes_update on public.crm_quotes for update to authenticated
using (
  public.user_has_crm_module_permission('update')
  and deleted_at is null
  and (
    created_by = auth.uid()
    or public.is_crm_operator()
  )
)
with check (public.user_has_crm_module_permission('update'));

-- Lignes devis
drop policy if exists crm_quote_lines_select on public.crm_quote_lines;
create policy crm_quote_lines_select on public.crm_quote_lines for select to authenticated
using (public.user_has_crm_module_permission('read'));

drop policy if exists crm_quote_lines_insert on public.crm_quote_lines;
create policy crm_quote_lines_insert on public.crm_quote_lines for insert to authenticated
with check (public.user_has_crm_module_permission('create'));

drop policy if exists crm_quote_lines_update on public.crm_quote_lines;
create policy crm_quote_lines_update on public.crm_quote_lines for update to authenticated
using (public.user_has_crm_module_permission('update'))
with check (public.user_has_crm_module_permission('update'));

drop policy if exists crm_quote_lines_delete on public.crm_quote_lines;
create policy crm_quote_lines_delete on public.crm_quote_lines for delete to authenticated
using (public.user_has_crm_module_permission('update'));

-- Activités
drop policy if exists crm_act_select on public.crm_activities;
create policy crm_act_select on public.crm_activities for select to authenticated
using (public.user_has_crm_module_permission('read') and deleted_at is null);

drop policy if exists crm_act_insert on public.crm_activities;
create policy crm_act_insert on public.crm_activities for insert to authenticated
with check (
  public.user_has_crm_module_permission('create')
  and created_by = auth.uid()
);

drop policy if exists crm_act_update on public.crm_activities;
create policy crm_act_update on public.crm_activities for update to authenticated
using (
  public.user_has_crm_module_permission('update')
  and deleted_at is null
  and (
    owner_id = auth.uid()
    or created_by = auth.uid()
    or public.is_crm_operator()
  )
)
with check (public.user_has_crm_module_permission('update'));

-- Prévisions
drop policy if exists crm_forecast_select on public.crm_forecast_snapshots;
create policy crm_forecast_select on public.crm_forecast_snapshots for select to authenticated
using (
  public.user_has_crm_module_permission('read')
  and (
    owner_id is null
    or owner_id = auth.uid()
    or public.is_crm_operator()
    or public.is_super_admin()
  )
);

drop policy if exists crm_forecast_insert on public.crm_forecast_snapshots;
create policy crm_forecast_insert on public.crm_forecast_snapshots for insert to authenticated
with check (
  public.user_has_crm_module_permission('create')
  and (
    owner_id is null
    or owner_id = auth.uid()
    or public.is_crm_operator()
  )
);

drop policy if exists crm_forecast_update on public.crm_forecast_snapshots;
create policy crm_forecast_update on public.crm_forecast_snapshots for update to authenticated
using (
  public.user_has_crm_module_permission('update')
  and (
    owner_id is null
    or owner_id = auth.uid()
    or public.is_crm_operator()
  )
)
with check (
  public.user_has_crm_module_permission('update')
  and (
    owner_id is null
    or owner_id = auth.uid()
    or public.is_crm_operator()
  )
);

commit;
