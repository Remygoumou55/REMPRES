-- 019_currency_rates_soft_compat_patch.sql
-- Patch compatibilité NON destructif pour harmoniser currency_rates
-- avec le schéma moderne (currency_code, rate_to_gnf) sans casser l'ancien.

do $$
begin
  -- Ajoute les colonnes modernes si absentes
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'currency_rates'
      and column_name = 'currency_code'
  ) then
    alter table public.currency_rates
      add column currency_code varchar(10);
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'currency_rates'
      and column_name = 'rate_to_gnf'
  ) then
    alter table public.currency_rates
      add column rate_to_gnf numeric(18,6);
  end if;

  -- Backfill depuis l'ancien schéma si disponible:
  -- rate = taux GNF -> devise, donc rate_to_gnf = 1 / rate
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'currency_rates'
      and column_name = 'quote_currency'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'currency_rates'
      and column_name = 'rate'
  ) then
    execute $sql$
      update public.currency_rates
      set
        currency_code = coalesce(currency_code, quote_currency),
        rate_to_gnf = coalesce(
          rate_to_gnf,
          case when rate is not null and rate > 0 then 1 / rate else null end
        )
      where currency_code is null or rate_to_gnf is null
    $sql$;
  end if;
end
$$;

-- Valeurs de base garanties
insert into public.currency_rates (currency_code, rate_to_gnf)
values
  ('XOF', 21.739130), -- ~ 1 / 0.046
  ('USD', 8620.689655), -- ~ 1 / 0.000116
  ('EUR', 9345.794393)  -- ~ 1 / 0.000107
on conflict do nothing;

-- Contrainte unique moderne (si possible)
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'currency_rates'
      and indexname = 'currency_rates_currency_code_key'
  ) then
    begin
      alter table public.currency_rates
        add constraint currency_rates_currency_code_key unique (currency_code);
    exception
      when others then
        -- En cas de doublons existants, on laisse passer sans bloquer le patch.
        null;
    end;
  end if;
end
$$;
