-- RemPres ERP – Table de taux de change
-- À exécuter dans Supabase SQL Editor après 005_vente_schema.sql

-- =============================================================================
-- TABLE : currency_rates
-- =============================================================================

create table if not exists public.currency_rates (
  id            uuid          primary key default gen_random_uuid(),
  currency_code varchar(10)   not null unique,  -- 'XOF', 'USD', 'EUR'…
  rate_to_gnf   numeric(18,6) not null,          -- combien de GNF vaut 1 unité
  updated_at    timestamptz   not null default now()
);

comment on table  public.currency_rates is 'Taux de change exprimés en GNF (devise de base).';
comment on column public.currency_rates.rate_to_gnf is '1 unité de currency_code = rate_to_gnf GNF.';

-- Données initiales (valeurs indicatives avril 2026)
insert into public.currency_rates (currency_code, rate_to_gnf) values
  ('XOF',  21.76),   -- 1 XOF ≈ 21,76 GNF
  ('USD',  8620.00), -- 1 USD ≈ 8 620 GNF
  ('EUR',  9350.00)  -- 1 EUR ≈ 9 350 GNF
on conflict (currency_code) do nothing;

-- RLS : lecture publique pour les authentifiés, écriture super_admin uniquement
alter table public.currency_rates enable row level security;

drop policy if exists currency_rates_select on public.currency_rates;
create policy currency_rates_select
on public.currency_rates for select
to authenticated
using (true);

drop policy if exists currency_rates_upsert on public.currency_rates;
create policy currency_rates_upsert
on public.currency_rates for all
to authenticated
using  (public.is_super_admin())
with check (public.is_super_admin());
