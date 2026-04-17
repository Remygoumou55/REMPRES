-- RemPres ERP - Core schema (Phase 1 foundations)
-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.app_roles (
  key text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null references public.app_roles(key) on update cascade on delete cascade,
  module_key text not null,
  can_create boolean not null default false,
  can_read boolean not null default true,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  can_approve boolean not null default false,
  can_export boolean not null default false,
  can_assign boolean not null default false,
  can_manage_users boolean not null default false,
  can_manage_settings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (role_key, module_key)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text unique,
  role_key text not null references public.app_roles(key),
  department_key text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  module_key text not null,
  action_key text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.currency_rates (
  id uuid primary key default gen_random_uuid(),
  base_currency text not null default 'GNF',
  quote_currency text not null,
  rate numeric(18,6) not null,
  source text not null default 'exchangerate-api',
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (base_currency, quote_currency)
);

create index if not exists idx_permissions_role_module on public.permissions(role_key, module_key);
create index if not exists idx_profiles_role on public.profiles(role_key);
create index if not exists idx_activity_logs_actor on public.activity_logs(actor_user_id, created_at desc);
create index if not exists idx_currency_rates_pair on public.currency_rates(base_currency, quote_currency);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_permissions_updated_at on public.permissions;
create trigger trg_permissions_updated_at
before update on public.permissions
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists trg_currency_rates_updated_at on public.currency_rates;
create trigger trg_currency_rates_updated_at
before update on public.currency_rates
for each row
execute procedure public.set_updated_at();

insert into public.app_roles (key, label)
values
  ('super_admin', 'Super Admin'),
  ('directeur_general', 'Directeur Général'),
  ('responsable_formation', 'Responsable Formation'),
  ('responsable_vente', 'Responsable Vente'),
  ('responsable_consultation', 'Responsable Consultation'),
  ('responsable_rh', 'Responsable RH'),
  ('responsable_marketing', 'Responsable Marketing'),
  ('responsable_logistique', 'Responsable Logistique'),
  ('comptable', 'Comptable'),
  ('employe', 'Employé'),
  ('auditeur', 'Auditeur')
on conflict (key) do update set label = excluded.label;

insert into public.currency_rates (base_currency, quote_currency, rate, source)
values
  ('GNF', 'GNF', 1, 'seed'),
  ('GNF', 'XOF', 0.046000, 'seed'),
  ('GNF', 'USD', 0.000116, 'seed'),
  ('GNF', 'EUR', 0.000107, 'seed')
on conflict (base_currency, quote_currency) do update
set rate = excluded.rate,
    source = excluded.source,
    updated_at = now();

alter table public.app_roles enable row level security;
alter table public.permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;
alter table public.currency_rates enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role_key
  from public.profiles p
  where p.id = auth.uid()
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'super_admin', false);
$$;

drop policy if exists app_roles_select_authenticated on public.app_roles;
create policy app_roles_select_authenticated
on public.app_roles
for select
to authenticated
using (true);

drop policy if exists app_roles_manage_super_admin on public.app_roles;
create policy app_roles_manage_super_admin
on public.app_roles
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists permissions_select_authenticated on public.permissions;
create policy permissions_select_authenticated
on public.permissions
for select
to authenticated
using (deleted_at is null);

drop policy if exists permissions_manage_super_admin on public.permissions;
create policy permissions_manage_super_admin
on public.permissions
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists profiles_select_own_or_super_admin on public.profiles;
create policy profiles_select_own_or_super_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_super_admin());

drop policy if exists profiles_update_own_or_super_admin on public.profiles;
create policy profiles_update_own_or_super_admin
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());

drop policy if exists profiles_insert_super_admin_only on public.profiles;
create policy profiles_insert_super_admin_only
on public.profiles
for insert
to authenticated
with check (public.is_super_admin());

drop policy if exists activity_logs_select_own_or_super_admin on public.activity_logs;
create policy activity_logs_select_own_or_super_admin
on public.activity_logs
for select
to authenticated
using (actor_user_id = auth.uid() or public.is_super_admin());

drop policy if exists activity_logs_insert_authenticated on public.activity_logs;
create policy activity_logs_insert_authenticated
on public.activity_logs
for insert
to authenticated
with check (actor_user_id = auth.uid() or public.is_super_admin());

drop policy if exists currency_rates_select_authenticated on public.currency_rates;
create policy currency_rates_select_authenticated
on public.currency_rates
for select
to authenticated
using (deleted_at is null);

drop policy if exists currency_rates_manage_super_admin on public.currency_rates;
create policy currency_rates_manage_super_admin
on public.currency_rates
for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());
