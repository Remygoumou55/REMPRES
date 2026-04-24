-- RemPres ERP — Phase 3 : Dépenses (catégories, RLS, RPC)
-- Exécuter APRÈS 005_vente_schema.sql
--
-- Contenu :
-- 1) Table expense_categories + graines
-- 2) Lien category_id sur expenses (migration depuis category texte)
-- 3) RLS : user = ses dépenses, super_admin = tout
-- 4) RPC create_expense_transaction (dépense + activity_logs)
-- 5) Permissions module "finance"

-- =============================================================================
-- 1) Catégories
-- =============================================================================

create table if not exists public.expense_categories (
  id         uuid         primary key default gen_random_uuid(),
  name       varchar(100) not null unique,
  color      varchar(7)   not null default '#64748B',
  sort_order int          not null default 0,
  created_at timestamptz  not null default now()
);

comment on table public.expense_categories is 'Libellés de dépenses (référentiel).';
comment on column public.expense_categories.color is 'Code hex (ex. #3B82F6).';

create index if not exists idx_expense_categories_sort on public.expense_categories (sort_order, name);

insert into public.expense_categories (name, color, sort_order) values
  ('Fournitures',       '#0EA5E9', 10),
  ('Transport',         '#F59E0B', 20),
  ('Loyers & charges',  '#8B5CF6', 30),
  ('Marketing',         '#EC4899', 40),
  ('Services',          '#10B981', 50),
  ('Autres',            '#64748B', 99)
on conflict (name) do nothing;

-- =============================================================================
-- 2) Lier expenses → expense_categories
-- =============================================================================

alter table public.expenses
  add column if not exists category_id uuid references public.expense_categories (id) on delete restrict;

-- Rétro-compat : remplir category_id à partir de l’ancien champ texte "category" si présent
update public.expenses e
set category_id = ec.id
from public.expense_categories ec
where e.category_id is null
  and e.category = ec.name;

update public.expenses e
set category_id = (select id from public.expense_categories where name = 'Autres' limit 1)
where e.category_id is null;

-- Contrainte NOT NULL une fois backfill
alter table public.expenses alter column category_id set not null;

drop index if exists idx_expenses_category;
create index if not exists idx_expenses_category_id on public.expenses (category_id);

-- Ancienne colonne texte devenue inutile
alter table public.expenses drop column if exists category;

-- Paiement : aligner sur la vente (mêmes libellés UI)
alter table public.expenses drop constraint if exists expenses_payment_method_check;
alter table public.expenses
  add constraint expenses_payment_method_check
  check (payment_method is null or payment_method in ('cash', 'mobile_money', 'bank_transfer', 'credit'));

-- =============================================================================
-- 3) RLS expense_categories
-- =============================================================================

alter table public.expense_categories enable row level security;

drop policy if exists expense_categories_select on public.expense_categories;
create policy expense_categories_select
  on public.expense_categories for select
  to authenticated
  using (true);

-- =============================================================================
-- 3b) RLS expenses (resserrer le SELECT)
-- =============================================================================

drop policy if exists expenses_select on public.expenses;
create policy expenses_select
  on public.expenses for select
  to authenticated
  using (
    deleted_at is null
    and (created_by = auth.uid() or public.is_super_admin())
  );

-- =============================================================================
-- 4) RPC create_expense_transaction
-- =============================================================================

create or replace function public.create_expense_transaction(
  p_user_id         uuid,
  p_category_id     uuid,
  p_amount_gnf      numeric(18, 2),
  p_description     text,
  p_expense_date    date,
  p_payment_method  text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id      uuid;
  v_cat     text;
  v_summary text;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'Opération non autorisée';
  end if;

  if p_amount_gnf is null or p_amount_gnf <= 0 then
    raise exception 'Le montant doit être supérieur à 0';
  end if;

  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'La description est obligatoire';
  end if;

  select c.name into v_cat
  from public.expense_categories c
  where c.id = p_category_id;

  if v_cat is null then
    raise exception 'Catégorie invalide';
  end if;

  if p_payment_method is not null
     and p_payment_method not in ('cash', 'mobile_money', 'bank_transfer', 'credit') then
    raise exception 'Mode de paiement invalide';
  end if;

  insert into public.expenses (
    category_id,
    description,
    amount_gnf,
    payment_method,
    expense_date,
    created_by
  ) values (
    p_category_id,
    trim(p_description),
    p_amount_gnf,
    nullif(trim(p_payment_method), ''),
    p_expense_date,
    p_user_id
  )
  returning id into v_id;

  v_summary := 'Nouvelle dépense ajoutée : ' || (round(p_amount_gnf, 0))::bigint::text
    || ' GNF (catégorie ' || v_cat || ')';

  insert into public.activity_logs (
    actor_user_id,
    module_key,
    action_key,
    target_table,
    target_id,
    metadata
  ) values (
    p_user_id,
    'depenses',
    'create',
    'expenses',
    v_id::text,
    jsonb_build_object(
      'summary',     v_summary,
      'amount_gnf',  p_amount_gnf,
      'category_name', v_cat
    )
  );

  return jsonb_build_object('id', v_id, 'summary', v_summary);
end;
$$;

comment on function public.create_expense_transaction is
  'Crée une dépense + entrée activity_logs (atomique, SECURITY DEFINER).';

grant execute on function public.create_expense_transaction(
  uuid, uuid, numeric, text, date, text
) to authenticated;

-- =============================================================================
-- 5) Permissions module finance
-- =============================================================================

insert into public.permissions (
  role_key, module_key,
  can_create, can_read, can_update, can_delete,
  can_approve, can_export, can_assign, can_manage_users, can_manage_settings,
  deleted_at
)
select
  r.key,
  'finance',
  case when r.key in ('super_admin', 'comptable', 'directeur_general') then true else false end,
  case
    when r.key in (
      'super_admin', 'comptable', 'directeur_general', 'auditeur', 'employe'
    ) then true
    else false
  end,
  case when r.key = 'super_admin' then true else false end,
  case when r.key = 'super_admin' then true else false end,
  false, false, false, false, false,
  null
from public.app_roles r
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_assign = excluded.can_assign,
  can_manage_users = excluded.can_manage_users,
  can_manage_settings = excluded.can_manage_settings,
  deleted_at = null,
  updated_at = now();
