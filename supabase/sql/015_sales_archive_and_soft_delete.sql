-- RemPres ERP — Archivage des ventes avant soft delete
-- Exécuter dans Supabase SQL Editor après 005_vente_schema.sql (et déploiements antérieurs).
--
-- 1) Table sales_archive (snapshot immutable côté métier : pas de policy UPDATE/DELETE)
-- 2) Fonction SECURITY DEFINER archive_and_soft_delete_sale : transaction atomique
-- 3) Politique sales élargie : soft delete si rôle avec can_delete sur module vente (ou créateur / super_admin)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table archive
-- ---------------------------------------------------------------------------

create table if not exists public.sales_archive (
  id                 uuid primary key default gen_random_uuid(),
  original_sale_id   uuid not null unique,
  archived_by        uuid references auth.users (id) on delete set null,
  client_id          uuid references public.clients (id) on delete set null,
  total_amount_gnf   numeric(18, 2),
  payment_status     text,
  created_at         timestamptz,
  archived_at        timestamptz not null default now(),
  raw_data           jsonb not null default '{}'::jsonb
);

comment on table public.sales_archive is
  'Copie figée d''une vente avant soft delete sur public.sales. Pas de mise à jour ni suppression applicative.';

create index if not exists idx_sales_archive_original_sale on public.sales_archive (original_sale_id);
create index if not exists idx_sales_archive_archived_at on public.sales_archive (archived_at desc);

alter table public.sales_archive enable row level security;

drop policy if exists sales_archive_select_authenticated on public.sales_archive;
create policy sales_archive_select_authenticated
on public.sales_archive
for select
to authenticated
using (true);

-- Aucune policy INSERT / UPDATE / DELETE : écriture réservée à la RPC SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- Helper : droit suppression vente (module vente, can_delete)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_delete_vente_rls()
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
     and p.module_key = 'vente'
     and p.can_delete = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC atomique : archive + soft delete
-- ---------------------------------------------------------------------------

create or replace function public.archive_and_soft_delete_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r     public.sales%rowtype;
  v_items jsonb;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  if p_sale_id is null then
    raise exception 'Vente invalide';
  end if;

  select * into r
  from public.sales
  where id = p_sale_id
    and deleted_at is null;

  if not found then
    raise exception 'Vente introuvable ou déjà supprimée';
  end if;

  if not (
    public.is_super_admin()
    or public.user_can_delete_vente_rls()
    or r.created_by = v_uid
  ) then
    raise exception 'Accès refusé';
  end if;

  select coalesce(jsonb_agg(to_jsonb(si.*)), '[]'::jsonb)
  into v_items
  from public.sale_items si
  where si.sale_id = p_sale_id;

  insert into public.sales_archive (
    original_sale_id,
    archived_by,
    client_id,
    total_amount_gnf,
    payment_status,
    created_at,
    raw_data
  )
  values (
    r.id,
    v_uid,
    r.client_id,
    r.total_amount_gnf,
    r.payment_status::text,
    r.created_at,
    jsonb_build_object('sale', to_jsonb(r), 'sale_items', v_items)
  );

  update public.sales
  set
    deleted_at = now(),
    updated_at = now()
  where id = p_sale_id
    and deleted_at is null;

  if not found then
    raise exception 'Erreur lors de la suppression de la vente';
  end if;
end;
$$;

comment on function public.archive_and_soft_delete_sale(uuid) is
  'Archive la vente + lignes dans sales_archive puis renseigne sales.deleted_at (une transaction).';

grant execute on function public.archive_and_soft_delete_sale(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- sales : permettre soft delete aux mêmes rôles que la RPC (cohérence RLS lecture/écriture directe)
-- ---------------------------------------------------------------------------

drop policy if exists sales_update on public.sales;

create policy sales_update
on public.sales
for update
to authenticated
using (
  deleted_at is null
  and (
    public.is_super_admin()
    or created_by = auth.uid()
    or public.user_can_delete_vente_rls()
  )
)
with check (
  public.is_super_admin()
  or created_by = auth.uid()
  or public.user_can_delete_vente_rls()
);
