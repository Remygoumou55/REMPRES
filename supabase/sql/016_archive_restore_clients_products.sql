-- RemPres ERP — deleted_by, lecture des archives, restauration (clients + produits)
-- Après 002_clients_schema.sql, 004/013/014 produits, 003 permissions.
-- Exécuter dans Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Colonnes
-- ---------------------------------------------------------------------------

alter table public.clients add column if not exists deleted_by uuid references auth.users (id) on delete set null;
alter table public.products add column if not exists deleted_by uuid references auth.users (id) on delete set null;

create index if not exists idx_clients_deleted_by on public.clients (deleted_by);
create index if not exists idx_products_deleted_by on public.products (deleted_by);

-- ---------------------------------------------------------------------------
-- Clients : qui peut voir archives / restaurer (can_delete module clients ou vente)
-- ---------------------------------------------------------------------------

create or replace function public.user_can_restore_clients_rls()
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
     and p.module_key in ('clients', 'vente')
     and p.can_delete = true
    where pr.id = auth.uid()
      and pr.deleted_at is null
  );
$$;

drop policy if exists clients_select_authenticated on public.clients;
create policy clients_select_authenticated
on public.clients
for select
to authenticated
using (
  deleted_at is null
  or (
    deleted_at is not null
    and public.user_can_restore_clients_rls()
  )
);

drop policy if exists clients_update_authenticated on public.clients;
create policy clients_update_authenticated
on public.clients
for update
to authenticated
using (deleted_at is null)
with check (
  created_by = auth.uid()
  or public.is_super_admin()
);

drop policy if exists clients_update_restore_authenticated on public.clients;
create policy clients_update_restore_authenticated
on public.clients
for update
to authenticated
using (
  deleted_at is not null
  and public.user_can_restore_clients_rls()
)
with check (
  deleted_at is null
  and deleted_by is null
  and public.user_can_restore_clients_rls()
);

-- ---------------------------------------------------------------------------
-- Produits : lecture archives + restauration
-- ---------------------------------------------------------------------------

drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated
on public.products
for select
to authenticated
using (
  (
    deleted_at is null
    and public.user_can_read_products_rls()
  )
  or (
    deleted_at is not null
    and (
      public.is_super_admin()
      or public.user_can_delete_products_rls()
    )
  )
);

drop policy if exists products_update_restore_authenticated on public.products;
create policy products_update_restore_authenticated
on public.products
for update
to authenticated
using (
  deleted_at is not null
  and (
    public.is_super_admin()
    or public.user_can_delete_products_rls()
  )
)
with check (
  deleted_at is null
  and deleted_by is null
  and public.user_can_mutate_product_row()
);

comment on function public.user_can_restore_clients_rls is
  'Voir archives clients et restaurer (super_admin ou can_delete clients/vente).';
