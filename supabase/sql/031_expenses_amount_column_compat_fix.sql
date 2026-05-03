-- =============================================================================
-- STEP 11 — Expenses RPC compatibility with legacy "amount" column
-- =============================================================================
-- Some environments still have public.expenses.amount declared NOT NULL.
-- This migration keeps create/update RPCs compatible whether "amount" exists or not.

-- Cleanup legacy/incorrect overloads that can make RPC resolution ambiguous.
drop function if exists public.create_expense_transaction(uuid, uuid, numeric, text, date, text);
drop function if exists public.create_expense_transaction(uuid, uuid, numeric, text, date, text, text);
drop function if exists public.create_expense_transaction(numeric, uuid, text, date, text, text, uuid);

drop function if exists public.update_expense_transaction(uuid, uuid, uuid, numeric, text, date, text, text);

do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'expense_payment_method'
  ) then
    execute 'drop function if exists public.create_expense_transaction(uuid, uuid, numeric, text, date, public.expense_payment_method, text)';
    execute 'drop function if exists public.update_expense_transaction(uuid, uuid, uuid, numeric, text, date, public.expense_payment_method, text)';
  end if;
end $$;

-- Ensure source_type accepts "expense" in all environments.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'financial_transactions'
  ) then
    alter table public.financial_transactions
      drop constraint if exists financial_transactions_source_type_check;

    alter table public.financial_transactions
      add constraint financial_transactions_source_type_check
      check (source_type in ('sale', 'training', 'consultation', 'expense'));
  end if;
end $$;

create or replace function public.create_expense_transaction(
  p_user_id         uuid,
  p_category_id     uuid,
  p_amount_gnf      numeric(18,2),
  p_description     text,
  p_expense_date    date,
  p_payment_method  text,
  p_receipt_url     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_id          uuid;
  v_cat         text;
  v_summary     text;
  v_desc        text;
  v_has_amount  boolean;
  v_has_payment_enum boolean;
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

  if p_payment_method is null
     or p_payment_method not in ('cash', 'mobile_money', 'bank_transfer', 'other')
  then
    raise exception 'Mode de paiement invalide';
  end if;

  select c.name into v_cat
  from public.expense_categories c
  where c.id = p_category_id;

  if v_cat is null then
    raise exception 'Catégorie invalide';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'expenses'
      and column_name = 'amount'
  ) into v_has_amount;

  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'expense_payment_method'
  ) into v_has_payment_enum;

  v_desc := left(trim(p_description), 500);

  if v_has_amount then
    if v_has_payment_enum then
      execute
        'insert into public.expenses (
          category_id, description, amount, amount_gnf, payment_method, expense_date, receipt_url, created_by
        ) values ($1, $2, $3, $3, $4::public.expense_payment_method, $5, $6, $7)
        returning id'
      into v_id
      using
        p_category_id,
        v_desc,
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        nullif(trim(coalesce(p_receipt_url, '''')), ''),
        p_user_id;
    else
      execute
        'insert into public.expenses (
          category_id, description, amount, amount_gnf, payment_method, expense_date, receipt_url, created_by
        ) values ($1, $2, $3, $3, $4, $5, $6, $7)
        returning id'
      into v_id
      using
        p_category_id,
        v_desc,
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        nullif(trim(coalesce(p_receipt_url, '''')), ''),
        p_user_id;
    end if;
  else
    if v_has_payment_enum then
      execute
        'insert into public.expenses (
          category_id, description, amount_gnf, payment_method, expense_date, receipt_url, created_by
        ) values ($1, $2, $3, $4::public.expense_payment_method, $5, $6, $7)
        returning id'
      into v_id
      using
        p_category_id,
        v_desc,
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        nullif(trim(coalesce(p_receipt_url, '''')), ''),
        p_user_id;
    else
      execute
        'insert into public.expenses (
          category_id, description, amount_gnf, payment_method, expense_date, receipt_url, created_by
        ) values ($1, $2, $3, $4, $5, $6, $7)
        returning id'
      into v_id
      using
        p_category_id,
        v_desc,
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        nullif(trim(coalesce(p_receipt_url, '''')), ''),
        p_user_id;
    end if;
  end if;

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
      'summary',      v_summary,
      'amount_gnf',   p_amount_gnf,
      'category_name', v_cat
    )
  );

  return jsonb_build_object('id', v_id, 'summary', v_summary);
end;
$$;

grant execute on function public.create_expense_transaction(
  uuid, uuid, numeric, text, date, text, text
) to authenticated;


create or replace function public.update_expense_transaction(
  p_expense_id     uuid,
  p_user_id        uuid,
  p_category_id    uuid,
  p_amount_gnf     numeric(18,2),
  p_description    text,
  p_expense_date   date,
  p_payment_method text,
  p_receipt_url    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row         public.expenses%rowtype;
  v_cat         text;
  v_sum         text;
  v_upd         boolean;
  v_has_amount  boolean;
  v_has_payment_enum boolean;
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

  if p_payment_method is null
     or p_payment_method not in ('cash', 'mobile_money', 'bank_transfer', 'other')
  then
    raise exception 'Mode de paiement invalide';
  end if;

  select c.name into v_cat from public.expense_categories c where c.id = p_category_id;
  if v_cat is null then
    raise exception 'Catégorie invalide';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'expenses'
      and column_name = 'amount'
  ) into v_has_amount;

  select exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'expense_payment_method'
  ) into v_has_payment_enum;

  if v_has_amount then
    if v_has_payment_enum then
      execute
        'update public.expenses
          set
            category_id = $1,
            description = $2,
            amount = $3,
            amount_gnf = $3,
            payment_method = $4::public.expense_payment_method,
            expense_date = $5,
            receipt_url = case when $6 is not null then nullif(trim($6), '''') else receipt_url end,
            updated_at = now()
          where id = $7'
      using
        p_category_id,
        left(trim(p_description), 2000),
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        p_receipt_url,
        p_expense_id;
    else
      execute
        'update public.expenses
          set
            category_id = $1,
            description = $2,
            amount = $3,
            amount_gnf = $3,
            payment_method = $4,
            expense_date = $5,
            receipt_url = case when $6 is not null then nullif(trim($6), '''') else receipt_url end,
            updated_at = now()
          where id = $7'
      using
        p_category_id,
        left(trim(p_description), 2000),
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        p_receipt_url,
        p_expense_id;
    end if;
  else
    if v_has_payment_enum then
      execute
        'update public.expenses
          set
            category_id = $1,
            description = $2,
            amount_gnf = $3,
            payment_method = $4::public.expense_payment_method,
            expense_date = $5,
            receipt_url = case when $6 is not null then nullif(trim($6), '''') else receipt_url end,
            updated_at = now()
          where id = $7'
      using
        p_category_id,
        left(trim(p_description), 2000),
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        p_receipt_url,
        p_expense_id;
    else
      execute
        'update public.expenses
          set
            category_id = $1,
            description = $2,
            amount_gnf = $3,
            payment_method = $4,
            expense_date = $5,
            receipt_url = case when $6 is not null then nullif(trim($6), '''') else receipt_url end,
            updated_at = now()
          where id = $7'
      using
        p_category_id,
        left(trim(p_description), 2000),
        p_amount_gnf,
        p_payment_method,
        p_expense_date,
        p_receipt_url,
        p_expense_id;
    end if;
  end if;

  update public.financial_transactions
  set
    amount_gnf      = p_amount_gnf,
    display_amount  = p_amount_gnf,
    amount_paid_gnf = p_amount_gnf,
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
  uuid, uuid, uuid, numeric, text, date, text, text
) to authenticated;
