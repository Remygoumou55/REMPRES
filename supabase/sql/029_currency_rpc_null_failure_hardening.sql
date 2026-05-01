-- 029_currency_rpc_null_failure_hardening.sql
-- STEP 7 — FINAL HARDENING
-- Keep signature unchanged; make failure explicit with NULL.

begin;

create or replace function public.convert_currency(
  amount numeric,
  from_currency text,
  to_currency text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric := amount;
  v_from text := upper(trim(coalesce(from_currency, '')));
  v_to text := upper(trim(coalesce(to_currency, '')));
  v_rate numeric;
  v_inverse numeric;
begin
  if v_amount is null or v_amount <= 0 then
    raise notice 'convert_currency invalid amount: %', v_amount;
    return null;
  end if;

  if v_from = '' or v_to = '' then
    raise notice 'convert_currency invalid currency codes: from=%, to=%', from_currency, to_currency;
    return null;
  end if;

  if v_from not in ('GNF', 'USD', 'EUR', 'XOF')
     or v_to not in ('GNF', 'USD', 'EUR', 'XOF') then
    raise notice 'convert_currency unsupported currency: from=%, to=%', v_from, v_to;
    return null;
  end if;

  if v_from = v_to then
    return round(v_amount, 2);
  end if;

  -- Direct pair (standard schema)
  select cr.rate
    into v_rate
  from public.currency_rates cr
  where upper(trim(coalesce(cr.base_currency, ''))) = v_from
    and upper(trim(coalesce(cr.quote_currency, ''))) = v_to
    and cr.rate is not null
    and cr.rate > 0
  order by coalesce(cr.fetched_at, cr.updated_at, now()) desc
  limit 1;

  if v_rate is not null and v_rate > 0 then
    return round(v_amount * v_rate, 2);
  end if;

  -- Inverse pair
  select cr.rate
    into v_inverse
  from public.currency_rates cr
  where upper(trim(coalesce(cr.base_currency, ''))) = v_to
    and upper(trim(coalesce(cr.quote_currency, ''))) = v_from
    and cr.rate is not null
    and cr.rate > 0
  order by coalesce(cr.fetched_at, cr.updated_at, now()) desc
  limit 1;

  if v_inverse is not null and v_inverse > 0 then
    return round(v_amount / v_inverse, 2);
  end if;

  -- Legacy compatibility: currency_code + rate_to_gnf
  if v_from = 'GNF' then
    select cr.rate_to_gnf
      into v_inverse
    from public.currency_rates cr
    where upper(trim(coalesce(cr.currency_code, ''))) = v_to
      and cr.rate_to_gnf is not null
      and cr.rate_to_gnf > 0
    order by coalesce(cr.updated_at, now()) desc
    limit 1;

    if v_inverse is not null and v_inverse > 0 then
      return round(v_amount / v_inverse, 2);
    end if;
  end if;

  if v_to = 'GNF' then
    select cr.rate_to_gnf
      into v_rate
    from public.currency_rates cr
    where upper(trim(coalesce(cr.currency_code, ''))) = v_from
      and cr.rate_to_gnf is not null
      and cr.rate_to_gnf > 0
    order by coalesce(cr.updated_at, now()) desc
    limit 1;

    if v_rate is not null and v_rate > 0 then
      return round(v_amount * v_rate, 2);
    end if;
  end if;

  raise notice 'convert_currency missing rate: from=%, to=%', v_from, v_to;
  return null;
exception
  when others then
    raise notice 'convert_currency failed: %', sqlerrm;
    return null;
end;
$$;

commit;
