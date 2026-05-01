-- 026_financial_currency_validation_hardening.sql
-- STEP 4 — Validation financière / devise (idempotent, non destructif).
-- Ne supprime aucune table ni aucune ligne ; corrige uniquement des anomalies évidentes
-- avant application des CHECK constraints.
--
-- Prérequis typiques : 005_vente_schema, 020_currency_system_standardization, …

begin;

-- ---------------------------------------------------------------------------
-- Normalisation minimale des devises (codes ERP connus)
-- ---------------------------------------------------------------------------

update public.sales
set display_currency = upper(trim(display_currency));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'currency'
  ) then
    execute $u$
      update public.sales
      set currency = upper(trim(coalesce(currency, display_currency, 'GNF')))
    $u$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'currency'
  ) then
    execute $u$
      update public.products
      set currency = upper(trim(coalesce(currency, 'GNF')))
    $u$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'currency'
  ) then
    execute $u$
      update public.expenses
      set currency = upper(trim(coalesce(currency, 'GNF')))
    $u$;
  end if;
end $$;

-- Réparation conservative des lignes hors bornes (ne pas « inventer » de métier autrement)
update public.sale_items
set unit_price_gnf = 0
where unit_price_gnf < 0;

update public.sale_items
set total_price_gnf = 0
where total_price_gnf < 0;

update public.sale_items
set discount_percent = 0
where discount_percent < 0;

update public.sale_items
set discount_percent = 100
where discount_percent > 100;

update public.products
set price_gnf = 0
where price_gnf < 0;

update public.products
set stock_quantity = 0
where stock_quantity < 0;

update public.products
set stock_threshold = 0
where stock_threshold < 0;

update public.expenses
set amount_gnf = 0
where amount_gnf < 0;

-- Colonnes optionnelles introduites par 020 — garder cohérence avec le canonique GNF
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  ) then
    execute $u$
      update public.products
      set price = greatest(coalesce(price, price_gnf, 0), 0)
    $u$;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'amount'
  ) then
    execute $u$
      update public.expenses
      set amount = greatest(coalesce(amount, amount_gnf, 0), 0)
    $u$;
  end if;
end $$;

update public.sales
set
  subtotal = greatest(subtotal, 0),
  discount_amount = greatest(discount_amount, 0),
  discount_percent = case
    when discount_percent < 0 then 0
    when discount_percent > 100 then 100
    else discount_percent
  end,
  total_amount_gnf = greatest(total_amount_gnf, 0),
  amount_paid_gnf = greatest(amount_paid_gnf, 0),
  exchange_rate = case
    when exchange_rate is null or exchange_rate <= 0 then 1
    else exchange_rate
  end;

-- Montants parallèles sales (020) — alignés sur total_amount_gnf si colonnes présentes
do $$
declare
  has_amgn boolean;
  has_tgt boolean;
  has_amt boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'amount_gnf'
  ) into has_amgn;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'total_gnf'
  ) into has_tgt;
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'amount'
  ) into has_amt;

  if has_amgn and has_tgt and has_amt then
    execute $u$
      update public.sales set
        amount_gnf = greatest(coalesce(amount_gnf, total_amount_gnf), 0),
        total_gnf = greatest(coalesce(total_gnf, total_amount_gnf), 0),
        amount = greatest(coalesce(amount, total_amount_gnf), 0)
    $u$;
  elsif has_amgn then
    execute $u$
      update public.sales set
        amount_gnf = greatest(coalesce(amount_gnf, total_amount_gnf), 0)
    $u$;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- NOT NULL sur colonnes canoniques (si présentes — échoue explicitement si NULL subsistent)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'currency'
  ) then
    alter table public.sales alter column currency set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'amount_gnf'
  ) then
    alter table public.sales alter column amount_gnf set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'currency'
  ) then
    alter table public.products alter column currency set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'currency'
  ) then
    alter table public.expenses alter column currency set not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'amount'
  ) then
    alter table public.expenses alter column amount set not null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- CHECK constraints — ventes / lignes / catalogue / dépenses
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_subtotal_nonneg'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_subtotal_nonneg check (subtotal >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_discount_amount_nonneg'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_discount_amount_nonneg check (discount_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_discount_percent_range'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_discount_percent_range
      check (discount_percent >= 0 and discount_percent <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_total_amount_gnf_nonneg'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_total_amount_gnf_nonneg check (total_amount_gnf >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_amount_paid_nonneg'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_amount_paid_nonneg check (amount_paid_gnf >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_exchange_rate_positive'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_exchange_rate_positive check (exchange_rate > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sales_display_currency_allowed'
      and conrelid = 'public.sales'::regclass
  ) then
    alter table public.sales add constraint chk_sales_display_currency_allowed
      check (upper(trim(display_currency)) in ('GNF', 'USD', 'EUR', 'XOF'));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'currency'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_sales_currency_allowed'
         and conrelid = 'public.sales'::regclass
     )
  then
    alter table public.sales add constraint chk_sales_currency_allowed
      check (upper(trim(currency)) in ('GNF', 'USD', 'EUR', 'XOF'));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'amount_gnf'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_sales_amount_gnf_mirror_nonneg'
         and conrelid = 'public.sales'::regclass
     )
  then
    alter table public.sales add constraint chk_sales_amount_gnf_mirror_nonneg check (amount_gnf >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'total_gnf'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_sales_total_gnf_mirror_nonneg'
         and conrelid = 'public.sales'::regclass
     )
  then
    alter table public.sales add constraint chk_sales_total_gnf_mirror_nonneg check (total_gnf >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'amount'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_sales_amount_mirror_nonneg'
         and conrelid = 'public.sales'::regclass
     )
  then
    alter table public.sales add constraint chk_sales_amount_mirror_nonneg check (amount >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_sale_items_unit_price_nonneg'
      and conrelid = 'public.sale_items'::regclass
  ) then
    alter table public.sale_items add constraint chk_sale_items_unit_price_nonneg check (unit_price_gnf >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sale_items_line_total_nonneg'
      and conrelid = 'public.sale_items'::regclass
  ) then
    alter table public.sale_items add constraint chk_sale_items_line_total_nonneg check (total_price_gnf >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_sale_items_discount_percent_range'
      and conrelid = 'public.sale_items'::regclass
  ) then
    alter table public.sale_items add constraint chk_sale_items_discount_percent_range
      check (discount_percent >= 0 and discount_percent <= 100);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_products_price_gnf_nonneg'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint chk_products_price_gnf_nonneg check (price_gnf >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_products_stock_quantity_nonneg'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint chk_products_stock_quantity_nonneg check (stock_quantity >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chk_products_stock_threshold_nonneg'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint chk_products_stock_threshold_nonneg check (stock_threshold >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'price'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_products_price_mirror_nonneg'
         and conrelid = 'public.products'::regclass
     )
  then
    alter table public.products add constraint chk_products_price_mirror_nonneg check (price >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'currency'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_products_currency_allowed'
         and conrelid = 'public.products'::regclass
     )
  then
    alter table public.products add constraint chk_products_currency_allowed
      check (upper(trim(currency)) in ('GNF', 'USD', 'EUR', 'XOF'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_expenses_amount_gnf_nonneg'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses add constraint chk_expenses_amount_gnf_nonneg check (amount_gnf >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'amount'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_expenses_amount_mirror_nonneg'
         and conrelid = 'public.expenses'::regclass
     )
  then
    alter table public.expenses add constraint chk_expenses_amount_mirror_nonneg check (amount >= 0);
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'expenses' and column_name = 'currency'
  )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_expenses_currency_allowed'
         and conrelid = 'public.expenses'::regclass
     )
  then
    alter table public.expenses add constraint chk_expenses_currency_allowed
      check (upper(trim(currency)) in ('GNF', 'USD', 'EUR', 'XOF'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- currency_rates — renforcer les codes sur la paire standard (si colonnes présentes)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'currency_rates' and column_name = 'base_currency'
  )
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public' and table_name = 'currency_rates' and column_name = 'quote_currency'
     )
     and not exists (
       select 1 from pg_constraint where conname = 'chk_currency_rates_iso_pair'
         and conrelid = 'public.currency_rates'::regclass
     )
  then
    alter table public.currency_rates add constraint chk_currency_rates_iso_pair
      check (
        upper(trim(base_currency)) in ('GNF', 'USD', 'EUR', 'XOF')
        and upper(trim(quote_currency)) in ('GNF', 'USD', 'EUR', 'XOF')
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- STEP 7 — Index : déjà présents dans la chaîne de migrations (évite les doublons).
--   • sales(client_id), sales(created_at) → voir 021_sales_performance_indexes.sql
--   • currency_rates(base_currency, quote_currency, …) → voir 020 et 021
-- ---------------------------------------------------------------------------

commit;
