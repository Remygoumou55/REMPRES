-- RemPres ERP - Products module schema (Sprint 2 - Vente)
-- Run this file in Supabase SQL Editor after:
--   001_core_schema.sql
--   002_clients_schema.sql

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  name text not null,
  description text,
  image_url text,
  unit text not null default 'unite',
  price_gnf numeric(18,2) not null default 0,
  stock_quantity integer not null default 0,
  stock_threshold integer not null default 5,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (sku)
);

comment on table public.products is 'Products catalog for sales module. Uses soft delete via deleted_at.';

-- Reuse global updated_at helper.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute procedure public.set_updated_at();

-- Performance indexes.
create index if not exists idx_products_deleted_at on public.products(deleted_at);
create index if not exists idx_products_created_at_desc on public.products(created_at desc);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_products_name on public.products(name);

alter table public.products enable row level security;

drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated
on public.products
for select
to authenticated
using (deleted_at is null);

drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated
on public.products
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists products_update_authenticated on public.products;
create policy products_update_authenticated
on public.products
for update
to authenticated
using (deleted_at is null)
with check (created_by = auth.uid() or public.is_super_admin());

-- Intentionally no DELETE policy: physical deletes are forbidden.
