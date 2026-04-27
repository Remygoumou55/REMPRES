-- RemPres ERP — RLS produits alignée sur la matrice permissions (produits + vente)
-- À exécuter dans Supabase SQL Editor après 004_products_schema.sql et 003_seed_profiles_permissions.sql
--
-- Problèmes corrigés par rapport à 004 d’origine :
--  - SELECT : tout utilisateur "authenticated" voyait tous les produits → lecture limitée aux rôles
--    autorisés (can_read sur module produits ou vente), + super_admin.
--  - INSERT : renforce with check avec droit can_create (en plus de created_by = auth.uid()).
--  - UPDATE : using clarifie que seul le créateur ou super_admin peut verrouiller la ligne ;
--    with check exige toujours le même ownership + droit can_update ou can_delete (ou super_admin).
--
-- Multi-tenant : ce schéma n’a PAS de organization_id. L’isolation est « par entreprise
-- (une base / un projet Supabase) » + rôles. Pour du vrai multi-tenant dans une même base,
-- ajouter organization_id + policies complémentaires (hors scope de ce fichier).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers SECURITY DEFINER (lisent permissions + profils, ignorent RLS cibles)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_read_products_rls()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.profiles pr
    inner join public.permissions p
      on p.role_key = pr.role_key
     and p.deleted_at is null
     and p.module_key in ('produits', 'vente')
     and p.can_read = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

create or replace function public.user_can_create_products_rls()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.profiles pr
    inner join public.permissions p
      on p.role_key = pr.role_key
     and p.deleted_at is null
     and p.module_key in ('produits', 'vente')
     and p.can_create = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

create or replace function public.user_can_update_products_rls()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.profiles pr
    inner join public.permissions p
      on p.role_key = pr.role_key
     and p.deleted_at is null
     and p.module_key in ('produits', 'vente')
     and p.can_update = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

create or replace function public.user_can_delete_products_rls()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
  or exists (
    select 1
    from public.profiles pr
    inner join public.permissions p
      on p.role_key = pr.role_key
     and p.deleted_at is null
     and p.module_key in ('produits', 'vente')
     and p.can_delete = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

-- Mise à jour d’un enregistrement (champs) : update OU soft-delete (champ deleted_at)
create or replace function public.user_can_mutate_product_row()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
  or public.user_can_update_products_rls()
  or public.user_can_delete_products_rls();
$$;

comment on function public.user_can_read_products_rls is
  'True si l’utilisateur peut lire le catalogue produits (modules produits/vente, can_read).';
comment on function public.user_can_create_products_rls is
  'True si insert produit autorisé (can_create).';
comment on function public.user_can_update_products_rls is
  'True si update champs autorisé (can_update).';
comment on function public.user_can_delete_products_rls is
  'True si soft delete autorisé (can_delete).';
comment on function public.user_can_mutate_product_row is
  'True si update ou soft-delete de ligne (can_update OR can_delete OR super_admin).';

-- ---------------------------------------------------------------------------
-- Policies remplacées
-- ---------------------------------------------------------------------------

drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated
on public.products
for select
to authenticated
using (
  deleted_at is null
  and public.user_can_read_products_rls()
);

drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated
on public.products
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_can_create_products_rls()
);

drop policy if exists products_update_authenticated on public.products;
create policy products_update_authenticated
on public.products
for update
to authenticated
using (
  deleted_at is null
  and (created_by = auth.uid() or public.is_super_admin())
  and public.user_can_mutate_product_row()
)
with check (
  (created_by = auth.uid() or public.is_super_admin())
  and public.user_can_mutate_product_row()
);
