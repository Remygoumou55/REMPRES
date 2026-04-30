-- 020_currency_system_standardization.sql
-- Standardisation professionnelle du système devise (idempotent, non destructif).

begin;

-- ============================================================================
-- 1) TABLE DE REFERENCE: currencies
-- ============================================================================
create table if not exists public.currencies (
  code text primary key,
  name text not null,
  symbol text,
  is_base boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.currencies (code, name, symbol, is_base)
values
  ('GNF', 'Franc guinéen', 'GNF', true),
  ('USD', 'US Dollar', '$', false),
  ('EUR', 'Euro', '€', false),
  ('XOF', 'Franc CFA (BCEAO)', 'FCFA', false)
on conflict (code) do update
set
  name = excluded.name,
  symbol = excluded.symbol;

-- Une seule devise de base
create unique index if not exists uq_currencies_single_base
  on public.currencies ((is_base))
  where is_base = true;

-- Répare l'état si plusieurs bases existent
update public.currencies
set is_base = case when code = 'GNF' then true else false end
where is_base is true
  and exists (
    select 1
    from public.currencies c
    where c.is_base is true
    group by c.is_base
    having count(*) > 1
  );

-- Garantit qu'il y a au moins une base
update public.currencies
set is_base = true
where code = 'GNF'
  and not exists (select 1 from public.currencies where is_base = true);

-- ============================================================================
-- 2) STANDARD TABLE: currency_rates
-- ============================================================================
-- On complète la table existante sans suppression destructive.
alter table public.currency_rates
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists base_currency text,
  add column if not exists quote_currency text,
  add column if not exists rate numeric(18,10),
  add column if not exists source text,
  add column if not exists fetched_at timestamptz,
  add column if not exists valid_from timestamptz default now(),
  add column if not exists created_at timestamptz default now();

-- Compatibilité avec schémas historiques/alternatifs
alter table public.currency_rates
  add column if not exists currency_code text,
  add column if not exists rate_to_gnf numeric(18,10),
  add column if not exists updated_at timestamptz;

-- Backfill depuis schéma "moderne v2" (currency_code + rate_to_gnf)
update public.currency_rates
set
  base_currency = coalesce(base_currency, 'GNF'),
  quote_currency = coalesce(quote_currency, currency_code),
  rate = coalesce(rate, case when rate_to_gnf is not null and rate_to_gnf > 0 then 1 / rate_to_gnf end),
  fetched_at = coalesce(fetched_at, updated_at, now()),
  created_at = coalesce(created_at, now()),
  valid_from = coalesce(valid_from, now()),
  source = coalesce(source, 'legacy-migration')
where
  (base_currency is null or quote_currency is null or rate is null)
  and currency_code is not null;

-- Backfill si base_currency existe mais quote/rate incomplets
update public.currency_rates
set
  quote_currency = coalesce(quote_currency, currency_code),
  fetched_at = coalesce(fetched_at, updated_at, now()),
  created_at = coalesce(created_at, now()),
  valid_from = coalesce(valid_from, now()),
  source = coalesce(source, 'legacy-migration')
where quote_currency is null and currency_code is not null;

-- Seed minimal (idempotent)
insert into public.currency_rates (base_currency, quote_currency, rate, source, fetched_at, valid_from, created_at)
values
  ('GNF', 'GNF', 1, 'seed', now(), now(), now()),
  ('GNF', 'XOF', 0.046, 'seed', now(), now(), now()),
  ('GNF', 'USD', 0.000116, 'seed', now(), now(), now()),
  ('GNF', 'EUR', 0.000107, 'seed', now(), now(), now())
on conflict (base_currency, quote_currency) do update
set
  rate = excluded.rate,
  source = excluded.source,
  fetched_at = excluded.fetched_at;

-- Contraintes de qualité / scalabilité
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'currency_rates_pk'
      and conrelid = 'public.currency_rates'::regclass
  ) then
    begin
      alter table public.currency_rates add constraint currency_rates_pk primary key (id);
    exception when others then
      -- Une PK peut déjà exister sous un autre nom: on ne casse pas la migration.
      null;
    end;
  end if;
end $$;

create unique index if not exists uq_currency_rates_pair
  on public.currency_rates (base_currency, quote_currency);

alter table public.currency_rates
  alter column base_currency set default 'GNF',
  alter column source set default 'manual',
  alter column fetched_at set default now(),
  alter column valid_from set default now(),
  alter column created_at set default now();

-- Normalise les nulls restants avant NOT NULL
update public.currency_rates set base_currency = 'GNF' where base_currency is null;
update public.currency_rates set quote_currency = 'GNF' where quote_currency is null;
update public.currency_rates set rate = 1 where rate is null or rate <= 0;
update public.currency_rates set source = 'manual' where source is null;
update public.currency_rates set fetched_at = now() where fetched_at is null;
update public.currency_rates set valid_from = now() where valid_from is null;
update public.currency_rates set created_at = now() where created_at is null;

alter table public.currency_rates
  alter column base_currency set not null,
  alter column quote_currency set not null,
  alter column rate set not null,
  alter column fetched_at set not null,
  alter column valid_from set not null,
  alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'currency_rates_rate_positive'
      and conrelid = 'public.currency_rates'::regclass
  ) then
    alter table public.currency_rates
      add constraint currency_rates_rate_positive check (rate > 0);
  end if;
end $$;

-- FKs vers currencies
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'currency_rates_base_currency_fkey'
      and conrelid = 'public.currency_rates'::regclass
  ) then
    alter table public.currency_rates
      add constraint currency_rates_base_currency_fkey
      foreign key (base_currency) references public.currencies(code) on update cascade on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'currency_rates_quote_currency_fkey'
      and conrelid = 'public.currency_rates'::regclass
  ) then
    alter table public.currency_rates
      add constraint currency_rates_quote_currency_fkey
      foreign key (quote_currency) references public.currencies(code) on update cascade on delete restrict;
  end if;
end $$;

create index if not exists idx_currency_rates_base_quote_fetched
  on public.currency_rates (base_currency, quote_currency, fetched_at desc);

create index if not exists idx_currency_rates_quote
  on public.currency_rates (quote_currency);

-- ============================================================================
-- 3) TABLES METIER (money columns)
-- ============================================================================
alter table public.products
  add column if not exists currency text not null default 'GNF',
  add column if not exists price numeric,
  add column if not exists price_gnf numeric;

alter table public.expenses
  add column if not exists currency text not null default 'GNF',
  add column if not exists amount numeric,
  add column if not exists amount_gnf numeric;

alter table public.sales
  add column if not exists currency text not null default 'GNF',
  add column if not exists amount numeric,
  add column if not exists total_gnf numeric,
  add column if not exists amount_gnf numeric;

-- Backfill sans écraser l'existant
update public.products
set
  price = coalesce(price, price_gnf, 0),
  price_gnf = coalesce(price_gnf, price, 0)
where price is null or price_gnf is null;

update public.expenses
set
  amount = coalesce(amount, amount_gnf, 0),
  amount_gnf = coalesce(amount_gnf, amount, 0)
where amount is null or amount_gnf is null;

update public.sales
set
  amount = coalesce(amount, amount_gnf, total_amount_gnf, 0),
  total_gnf = coalesce(total_gnf, amount_gnf, total_amount_gnf, 0),
  amount_gnf = coalesce(amount_gnf, total_gnf, total_amount_gnf, amount, 0)
where amount is null or amount_gnf is null or total_gnf is null;

-- ============================================================================
-- 4) FONCTION DE CONVERSION SQL (drop + create propre)
-- ============================================================================
drop function if exists public.convert_currency(numeric, text, text);

create function public.convert_currency(
  p_amount numeric,
  p_from_currency text,
  p_to_currency text
)
returns numeric
language plpgsql
stable
as $$
declare
  v_from text;
  v_to text;
  v_rate numeric;
begin
  if p_amount is null then
    return null;
  end if;

  v_from := upper(trim(coalesce(p_from_currency, '')));
  v_to := upper(trim(coalesce(p_to_currency, '')));

  if v_from = '' or v_to = '' then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_CURRENCY',
      detail = 'from_currency et to_currency sont obligatoires.';
  end if;

  if v_from = v_to then
    return p_amount;
  end if;

  -- Taux direct
  select cr.rate into v_rate
  from public.currency_rates cr
  where cr.base_currency = v_from
    and cr.quote_currency = v_to
  order by cr.fetched_at desc
  limit 1;

  if v_rate is not null and v_rate > 0 then
    return p_amount * v_rate;
  end if;

  -- Taux inverse
  select (1 / cr.rate) into v_rate
  from public.currency_rates cr
  where cr.base_currency = v_to
    and cr.quote_currency = v_from
    and cr.rate > 0
  order by cr.fetched_at desc
  limit 1;

  if v_rate is not null and v_rate > 0 then
    return p_amount * v_rate;
  end if;

  raise exception using
    errcode = 'P0002',
    message = 'MISSING_CURRENCY_RATE',
    detail = format('Aucun taux disponible pour %s -> %s.', v_from, v_to);
end;
$$;

-- ============================================================================
-- 5) AUTOMATISATION (trigger)
-- ============================================================================
drop function if exists public.update_gnf_amount();

create function public.update_gnf_amount()
returns trigger
language plpgsql
as $$
declare
  v_currency text;
  v_amount numeric;
  v_converted numeric;
begin
  if tg_table_name = 'products' then
    v_currency := upper(trim(coalesce(new.currency, 'GNF')));
    v_amount := coalesce(new.price, new.price_gnf, 0);

    if v_currency = 'GNF' then
      new.price_gnf := v_amount;
    else
      v_converted := public.convert_currency(v_amount, v_currency, 'GNF');
      new.price_gnf := v_converted;
    end if;
    new.currency := v_currency;
    return new;
  end if;

  if tg_table_name = 'sales' then
    v_currency := upper(trim(coalesce(new.currency, 'GNF')));
    v_amount := coalesce(new.total_gnf, new.amount_gnf, new.total_amount_gnf, 0);

    if v_currency = 'GNF' then
      new.amount_gnf := v_amount;
      if new.total_gnf is not null then
        new.total_gnf := v_amount;
      end if;
      if new.total_amount_gnf is not null then
        new.total_amount_gnf := v_amount;
      end if;
    else
      v_converted := public.convert_currency(v_amount, v_currency, 'GNF');
      new.amount_gnf := v_converted;
      if new.total_gnf is not null then
        new.total_gnf := v_converted;
      end if;
      if new.total_amount_gnf is not null then
        new.total_amount_gnf := v_converted;
      end if;
    end if;
    new.currency := v_currency;
    return new;
  end if;

  if tg_table_name = 'expenses' then
    v_currency := upper(trim(coalesce(new.currency, 'GNF')));
    v_amount := coalesce(new.amount, new.amount_gnf, 0);

    if v_currency = 'GNF' then
      new.amount_gnf := v_amount;
    else
      v_converted := public.convert_currency(v_amount, v_currency, 'GNF');
      new.amount_gnf := v_converted;
    end if;
    new.currency := v_currency;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_update_gnf_amount on public.products;
create trigger trg_products_update_gnf_amount
before insert or update on public.products
for each row
execute function public.update_gnf_amount();

drop trigger if exists trg_sales_update_gnf_amount on public.sales;
create trigger trg_sales_update_gnf_amount
before insert or update on public.sales
for each row
execute function public.update_gnf_amount();

drop trigger if exists trg_expenses_update_gnf_amount on public.expenses;
create trigger trg_expenses_update_gnf_amount
before insert or update on public.expenses
for each row
execute function public.update_gnf_amount();

-- ============================================================================
-- 6) RLS
-- ============================================================================
alter table public.currencies enable row level security;
alter table public.currency_rates enable row level security;

drop policy if exists currencies_select_authenticated on public.currencies;
create policy currencies_select_authenticated
on public.currencies
for select
to authenticated
using (true);

drop policy if exists currency_rates_select on public.currency_rates;
create policy currency_rates_select
on public.currency_rates
for select
to authenticated
using (true);

drop policy if exists currency_rates_upsert on public.currency_rates;
drop policy if exists currency_rates_insert_admin on public.currency_rates;
drop policy if exists currency_rates_update_admin on public.currency_rates;

create policy currency_rates_insert_admin
on public.currency_rates
for insert
to authenticated
with check (public.is_super_admin());

create policy currency_rates_update_admin
on public.currency_rates
for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

commit;
