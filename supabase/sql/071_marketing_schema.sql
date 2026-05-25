-- 071_marketing_schema.sql
-- Marketing operational records: campaigns + leads (idempotent).
-- Independent from crm_leads (CRM domain) so the marketing team can
-- run acquisition campaigns and qualify leads before handing over
-- qualified ones to /vente/clients.

begin;

-- ═══════════════════════════════════════════
-- Marketing permissions (module_key='marketing')
-- ═══════════════════════════════════════════
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'marketing', true, true, true, true, null),
  ('manager', 'marketing', true, true, true, false, null),
  ('agent', 'marketing', false, true, false, false, null),
  ('accountant', 'marketing', false, true, false, false, null),
  ('auditor', 'marketing', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

-- ═══════════════════════════════════════════
-- Marketing operator helper
-- ═══════════════════════════════════════════
create or replace function public.is_marketing_operator()
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
        and upper(coalesce(p.department_key, '')) = 'MARKETING'
    );
$$;

grant execute on function public.is_marketing_operator() to authenticated;

-- ═══════════════════════════════════════════
-- CAMPAIGNS
-- ═══════════════════════════════════════════
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'autre'
    check (type in ('email', 'social', 'sms', 'event', 'radio', 'affichage', 'autre')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  budget_gnf numeric(18, 2) not null default 0 check (budget_gnf >= 0),
  target_audience text,
  goal text,
  channel text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_campaigns_status
  on public.campaigns(status) where deleted_at is null;
create index if not exists idx_campaigns_type
  on public.campaigns(type) where deleted_at is null;
create index if not exists idx_campaigns_created
  on public.campaigns(created_at desc) where deleted_at is null;

-- ═══════════════════════════════════════════
-- LEADS
-- ═══════════════════════════════════════════
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  company text,
  source text not null default 'autre'
    check (source in ('campaign', 'referral', 'website', 'social', 'event', 'cold', 'autre')),
  campaign_id uuid references public.campaigns(id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'proposal', 'converted', 'lost')),
  estimated_value_gnf numeric(18, 2) not null default 0 check (estimated_value_gnf >= 0),
  notes text,
  converted_client_id uuid references public.clients(id) on delete set null,
  converted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_leads_status
  on public.leads(status) where deleted_at is null;
create index if not exists idx_leads_source
  on public.leads(source) where deleted_at is null;
create index if not exists idx_leads_campaign
  on public.leads(campaign_id) where deleted_at is null;
create index if not exists idx_leads_created
  on public.leads(created_at desc) where deleted_at is null;

-- ═══════════════════════════════════════════
-- Triggers updated_at
-- ═══════════════════════════════════════════
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'set_updated_at') then
    create function public.set_updated_at()
    returns trigger language plpgsql as $body$
    begin
      new.updated_at = now();
      return new;
    end;
    $body$;
  end if;
end$$;

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists trg_leads_updated_at on public.leads;
create trigger trg_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;

-- ─── Campaigns ─────────────────────────────
drop policy if exists campaigns_read on public.campaigns;
create policy campaigns_read
on public.campaigns for select to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'read')
);

drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert
on public.campaigns for insert to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'create')
);

drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update
on public.campaigns for update to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'update')
);

drop policy if exists campaigns_delete on public.campaigns;
create policy campaigns_delete
on public.campaigns for delete to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'delete')
);

-- ─── Leads ─────────────────────────────────
drop policy if exists leads_read on public.leads;
create policy leads_read
on public.leads for select to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'read')
);

drop policy if exists leads_insert on public.leads;
create policy leads_insert
on public.leads for insert to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'create')
);

drop policy if exists leads_update on public.leads;
create policy leads_update
on public.leads for update to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'update')
);

drop policy if exists leads_delete on public.leads;
create policy leads_delete
on public.leads for delete to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('marketing', 'delete')
);

commit;
