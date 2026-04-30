-- RemPres ERP — Archives clients/produits : visibilité restreinte pour les utilisateurs standards
-- Après 016_archive_restore_clients_products.sql
--
-- Règle :
--   - super_admin : toutes les lignes archivées (SELECT + UPDATE restore)
--   - autres avec droit restore / can_delete : uniquement les enregistrements dont ils sont le créateur (created_by = auth.uid())
--
-- À exécuter dans Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------

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
    and (
      public.is_super_admin()
      or created_by = auth.uid()
    )
  )
);

drop policy if exists clients_update_restore_authenticated on public.clients;
create policy clients_update_restore_authenticated
on public.clients
for update
to authenticated
using (
  deleted_at is not null
  and public.user_can_restore_clients_rls()
  and (
    public.is_super_admin()
    or created_by = auth.uid()
  )
)
with check (
  deleted_at is null
  and deleted_by is null
  and public.user_can_restore_clients_rls()
);

-- ---------------------------------------------------------------------------
-- Produits
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
      or (
        public.user_can_delete_products_rls()
        and created_by = auth.uid()
      )
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
    or (
      public.user_can_delete_products_rls()
      and created_by = auth.uid()
    )
  )
)
with check (
  deleted_at is null
  and deleted_by is null
  and public.user_can_mutate_product_row()
);
