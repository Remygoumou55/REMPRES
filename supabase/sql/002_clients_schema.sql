-- RemPres ERP - Clients module schema (Sprint 1)
-- Run this file in Supabase SQL Editor after 001_core_schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  client_type text not null check (client_type in ('individual', 'company')),
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  address text,
  city text,
  country text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.clients is 'Clients master table for sales module. Uses soft delete via deleted_at.';
comment on column public.clients.client_type is 'Allowed values: individual or company.';
comment on column public.clients.deleted_at is 'Soft delete timestamp. Null means active.';

-- Enforce valid naming rules depending on client type.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clients_name_by_type_chk'
      and conrelid = 'public.clients'::regclass
  ) then
    alter table public.clients
    add constraint clients_name_by_type_chk
    check (
      (client_type = 'individual' and first_name is not null and btrim(first_name) <> '' and last_name is not null and btrim(last_name) <> '')
      or
      (client_type = 'company' and company_name is not null and btrim(company_name) <> '')
    );
  end if;
end
$$;

-- Keep email normalized in lowercase + trimmed.
create or replace function public.normalize_client_email()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.email = lower(btrim(new.email));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_normalize_email on public.clients;
create trigger trg_clients_normalize_email
before insert or update on public.clients
for each row
execute procedure public.normalize_client_email();

-- Reuse global updated_at helper from core schema if available.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row
execute procedure public.set_updated_at();

-- Performance indexes.
create index if not exists idx_clients_deleted_at on public.clients(deleted_at);
create index if not exists idx_clients_email_lower on public.clients(lower(email));
create index if not exists idx_clients_company_name on public.clients(company_name);
create index if not exists idx_clients_last_name on public.clients(last_name);
create index if not exists idx_clients_created_at_desc on public.clients(created_at desc);

alter table public.clients enable row level security;

-- Minimal baseline RLS. Will be refined with permissions matrix later.
drop policy if exists clients_select_authenticated on public.clients;
create policy clients_select_authenticated
on public.clients
for select
to authenticated
using (deleted_at is null);

drop policy if exists clients_insert_authenticated on public.clients;
create policy clients_insert_authenticated
on public.clients
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists clients_update_authenticated on public.clients;
create policy clients_update_authenticated
on public.clients
for update
to authenticated
using (deleted_at is null)
with check (created_by = auth.uid() or public.is_super_admin());

-- Intentionally no DELETE policy: physical deletes are forbidden.
