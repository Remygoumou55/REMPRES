-- RemPres ERP — Dépenses niveau entreprise (ENUM paiement, financial_transactions, update/delete, storage)
-- Exécuter APRÈS 011 et 008 (financial_transactions).
-- Montant canonique : public.expenses.amount_gnf (aucune colonne "amount" métier).
--
-- Contenu :
-- 1) ENUM payment_method
-- 2) financial_transactions.source_type : ajouter 'expense'
-- 3) record_financial_transaction : accepter 'expense'
-- 4) Recréer create_expense_transaction (FT + receipt_url)
-- 5) update_expense_transaction / delete_expense_transaction
-- 6) RLS expenses (UPDATE / DELETE)
-- 7) Permissions finance (update/delete)
-- 8) Storage bucket expenses-receipts

-- =============================================================================
-- 1) ENUM mode de paiement dépense
-- =============================================================================

do $$ begin
  create type public.expense_payment_method as enum (
    'cash',
    'mobile_money',
    'bank_transfer',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.expenses drop constraint if exists expenses_payment_method_check;

update public.expenses
set payment_method = 'other'
where payment_method in ('credit');

-- text → enum
alter table public.expenses
  alter column payment_method type public.expense_payment_method
  using case
    when payment_method is null then null
    when payment_method = 'cash' then 'cash'::public.expense_payment_method
    when payment_method = 'mobile_money' then 'mobile_money'::public.expense_payment_method
    when payment_method = 'bank_transfer' then 'bank_transfer'::public.expense_payment_method
    when payment_method = 'other' then 'other'::public.expense_payment_method
    else 'other'::public.expense_payment_method
  end;

-- =============================================================================
-- 2) financial_transactions : type source « expense »
-- =============================================================================

alter table public.financial_transactions
  drop constraint if exists financial_transactions_source_type_check;

alter table public.financial_transactions
  add constraint financial_transactions_source_type_check
  check (source_type in ('sale', 'training', 'consultation', 'expense'));

comment on column public.financial_transactions.source_type is
  'Module source : sale | training | consultation | expense (dépenses)';

-- =============================================================================
-- 3) record_financial_transaction — accepter le type source 'expense'
-- =============================================================================

create or replace function public.record_financial_transaction(
  p_source_type      text,
  p_source_id        uuid,
  p_client_id        uuid,
  p_created_by       uuid,
  p_amount_gnf       numeric(18,2),
  p_display_currency text         default 'GNF',
  p_exchange_rate    numeric(18,6) default 1,
  p_description      text         default null,
  p_status           text         default 'pending'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_ft_id        uuid;
  v_display_amt  numeric(18,2);
begin
  if p_source_type not in ('sale', 'training', 'consultation', 'expense') then
    raise exception using errcode = 'P0001', message = 'INVALID_SOURCE_TYPE',
      detail = format('source_type invalide : "%s". Valeurs : sale, training, consultation, expense.', p_source_type);
  end if;

  if p_amount_gnf <= 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_AMOUNT',
      detail = format('Le montant doit être > 0 GNF (reçu : %s).', p_amount_gnf);
  end if;

  v_display_amt := round(p_amount_gnf * coalesce(p_exchange_rate, 1), 2);

  insert into public.financial_transactions (
    source_type, source_id, client_id, created_by,
    amount_gnf, display_currency, display_amount, exchange_rate,
    status, description
  ) values (
    p_source_type, p_source_id, p_client_id, p_created_by,
    p_amount_gnf, coalesce(p_display_currency, 'GNF'), v_display_amt, coalesce(p_exchange_rate, 1),
    coalesce(p_status, 'pending'), p_description
  )
  on conflict (source_type, source_id) do nothing
  returning id into v_ft_id;

  return v_ft_id;
end;
$$;

-- =============================================================================
-- 4) create_expense_transaction — FT + receipt_url
-- =============================================================================

drop function if exists public.create_expense_transaction(uuid, uuid, numeric, text, date, text);

create or replace function public.create_expense_transaction(
  p_user_id         uuid,
  p_category_id     uuid,
  p_amount_gnf      numeric(18,2),
  p_description     text,
  p_expense_date    date,
  p_payment_method  public.expense_payment_method,
  p_receipt_url     text default null
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
  v_desc    text;
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

  v_desc := left(trim(p_description), 500);

  insert into public.expenses (
    category_id,
    description,
    amount_gnf,
    payment_method,
    expense_date,
    receipt_url,
    created_by
  ) values (
    p_category_id,
    v_desc,
    p_amount_gnf,
    p_payment_method,
    p_expense_date,
    nullif(trim(coalesce(p_receipt_url, '')), ''),
    p_user_id
  ) returning id into v_id;

  insert into public.financial_transactions (
    source_type,
    source_id,
    client_id,
    created_by,
    amount_gnf,
    display_currency,
    display_amount,
    exchange_rate,
    status,
    amount_paid_gnf,
    paid_at,
    description
  ) values (
    'expense',
    v_id,
    null,
    p_user_id,
    p_amount_gnf,
    'GNF',
    p_amount_gnf,
    1,
    'paid',
    p_amount_gnf,
    now(),
    'Dépense : ' || v_desc
  )
  on conflict (source_type, source_id) do nothing;

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

grant execute on function public.create_expense_transaction(
  uuid, uuid, numeric, text, date, public.expense_payment_method, text
) to authenticated;

-- =============================================================================
-- 5) update_expense_transaction
-- =============================================================================

create or replace function public.update_expense_transaction(
  p_expense_id     uuid,
  p_user_id        uuid,
  p_category_id    uuid,
  p_amount_gnf     numeric(18,2),
  p_description     text,
  p_expense_date   date,
  p_payment_method public.expense_payment_method,
  p_receipt_url    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row   public.expenses%rowtype;
  v_cat   text;
  v_sum   text;
  v_upd   boolean;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'Opération non autorisée';
  end if;

  select * into v_row
  from public.expenses
  where id = p_expense_id and deleted_at is null;

  if v_row.id is null then
    raise exception 'Dépense introuvable';
  end if;

  v_upd := p_user_id = v_row.created_by or public.is_super_admin();
  if not v_upd then
    raise exception 'Modification interdite';
  end if;

  if p_amount_gnf is null or p_amount_gnf <= 0 then
    raise exception 'Le montant doit être supérieur à 0';
  end if;

  select c.name into v_cat from public.expense_categories c where c.id = p_category_id;
  if v_cat is null then
    raise exception 'Catégorie invalide';
  end if;

  update public.expenses
  set
    category_id     = p_category_id,
    description     = left(trim(p_description), 2000),
    amount_gnf      = p_amount_gnf,
    payment_method  = p_payment_method,
    expense_date    = p_expense_date,
    receipt_url     = case
      when p_receipt_url is not null then nullif(trim(p_receipt_url), '')
      else v_row.receipt_url
    end,
    updated_at      = now()
  where id = p_expense_id;

  update public.financial_transactions
  set
    amount_gnf       = p_amount_gnf,
    display_amount  = p_amount_gnf,
    amount_paid_gnf  = p_amount_gnf,
    description     = 'Dépense : ' || left(trim(p_description), 500),
    updated_at      = now()
  where source_type = 'expense' and source_id = p_expense_id;

  v_sum := 'Dépense modifiée : ' || (round(p_amount_gnf, 0))::bigint::text
    || ' GNF (catégorie ' || v_cat || ')';

  insert into public.activity_logs (
    actor_user_id, module_key, action_key, target_table, target_id, metadata
  ) values (
    p_user_id, 'depenses', 'update', 'expenses', p_expense_id::text,
    jsonb_build_object('summary', v_sum, 'amount_gnf', p_amount_gnf, 'category_name', v_cat)
  );

  return jsonb_build_object('id', p_expense_id, 'summary', v_sum);
end;
$$;

grant execute on function public.update_expense_transaction(
  uuid, uuid, uuid, numeric, text, date, public.expense_payment_method, text
) to authenticated;

-- =============================================================================
-- 6) delete_expense_transaction (soft delete)
-- =============================================================================

create or replace function public.delete_expense_transaction(
  p_expense_id uuid,
  p_user_id    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row  public.expenses%rowtype;
  v_sum  text;
  v_ok   boolean;
  v_cat  text;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'Opération non autorisée';
  end if;

  select * into v_row
  from public.expenses
  where id = p_expense_id and deleted_at is null;

  if v_row.id is null then
    raise exception 'Dépense introuvable';
  end if;

  v_ok := p_user_id = v_row.created_by or public.is_super_admin();
  if not v_ok then
    raise exception 'Suppression interdite';
  end if;

  select c.name into v_cat from public.expense_categories c where c.id = v_row.category_id;

  update public.expenses
  set deleted_at = now(), updated_at = now()
  where id = p_expense_id;

  update public.financial_transactions
  set
    status = 'cancelled',
    updated_at = now()
  where source_type = 'expense' and source_id = p_expense_id;

  v_sum := 'Dépense supprimée : ' || (round(v_row.amount_gnf, 0))::bigint::text || ' GNF';

  insert into public.activity_logs (
    actor_user_id, module_key, action_key, target_table, target_id, metadata
  ) values (
    p_user_id, 'depenses', 'delete', 'expenses', p_expense_id::text,
    jsonb_build_object(
      'summary',     v_sum,
      'amount_gnf',  v_row.amount_gnf,
      'category_name', coalesce(v_cat, '—')
    )
  );

  return jsonb_build_object('id', p_expense_id, 'summary', v_sum);
end;
$$;

grant execute on function public.delete_expense_transaction(uuid, uuid) to authenticated;

-- =============================================================================
-- 7) RLS — UPDATE (y compris soft delete : deleted_at) sur expenses
-- =============================================================================

drop policy if exists expenses_update on public.expenses;
create policy expenses_update
  on public.expenses for update
  to authenticated
  using  (
    deleted_at is null
    and (created_by = auth.uid() or public.is_super_admin())
  )
  with check (
    created_by = auth.uid() or public.is_super_admin()
  );

-- =============================================================================
-- 8) Permissions module finance (mise à jour)
-- =============================================================================

update public.permissions
set
  can_update = case
    when role_key in ('super_admin', 'comptable', 'directeur_general') then true
    else can_update
  end,
  can_delete = case
    when role_key in ('super_admin', 'comptable', 'directeur_general') then true
    else can_delete
  end,
  updated_at = now()
where module_key = 'finance';

-- =============================================================================
-- 9) Storage — bucket + policies (si schéma storage présent)
-- =============================================================================

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'expenses-receipts',
      'expenses-receipts',
      true,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']::text[]
    )
    on conflict (id) do update
    set
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;

-- Policies storage (sélectif)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'receipts_read_authenticated' and schemaname = 'storage' and tablename = 'objects') then
    create policy "receipts_read_authenticated"
    on storage.objects for select
    to authenticated
    using ( bucket_id = 'expenses-receipts' );
  end if;
exception when undefined_table then
  null;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'receipts_insert_own' and schemaname = 'storage' and tablename = 'objects') then
    create policy "receipts_insert_own"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'expenses-receipts'
      and split_part(name, '/', 1) = auth.uid()::text
    );
  end if;
exception when undefined_table then
  null;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'receipts_update_own' and schemaname = 'storage' and tablename = 'objects') then
    create policy "receipts_update_own"
    on storage.objects for update
    to authenticated
    using ( bucket_id = 'expenses-receipts' and split_part(name, '/', 1) = auth.uid()::text );
  end if;
exception when undefined_table then
  null;
end
$$;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'receipts_delete_own' and schemaname = 'storage' and tablename = 'objects') then
    create policy "receipts_delete_own"
    on storage.objects for delete
    to authenticated
    using ( bucket_id = 'expenses-receipts' and split_part(name, '/', 1) = auth.uid()::text );
  end if;
exception when undefined_table then
  null;
end
$$;
