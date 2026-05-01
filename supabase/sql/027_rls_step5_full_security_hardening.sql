-- 027_rls_step5_full_security_hardening.sql
-- STEP 5 — Consolidation RLS (sans nouveau schéma métier).
--
-- IMPORTANT RemPres ERP :
--  • Il n’y a PAS de colonne générique user_id sur ces tables : la possession métier
--    est portée par created_by et (pour les ventes) seller_id sur public.sales.
--    Les rôles applicatifs sont dans public.profiles (profiles.id = auth.uid(), profiles.role_key).
--  • Les admins canoniques sont déjà couverts par public.is_admin_role()
--    (voir 022_rls_roles_policies_hardening.sql).
--  • Cette migration ne supprime aucune donnée ; elle ré-applique / complète les politiques.
--
-- Prérequis : 015_sales_archive_and_soft_delete (fonction user_can_delete_vente_rls),
--             022_rls_roles_policies_hardening, 023_rls_sales_security_completion.

begin;

-- ---------------------------------------------------------------------------
-- STEP 1 — Activer RLS (idempotent)
-- ---------------------------------------------------------------------------

alter table if exists public.sales enable row level security;
alter table if exists public.sale_items enable row level security;
alter table if exists public.products enable row level security;
alter table if exists public.expenses enable row level security;
alter table if exists public.currency_rates enable row level security;

comment on column public.sales.created_by is 'Créateur de la vente — utilisé pour RLS (auth.uid()).';
comment on column public.sales.seller_id is 'Vendeur associé — accès RLS conjoint avec created_by.';
comment on column public.products.created_by is 'Propriétaire métier du produit — RLS (auth.uid()).';
comment on column public.expenses.created_by is 'Créateur de la dépense — RLS (auth.uid()).';

-- ---------------------------------------------------------------------------
-- Ventes — éviter dérive avec 015 : garder seller_id + droits module + archive métier
-- ---------------------------------------------------------------------------

drop policy if exists sales_select on public.sales;
create policy sales_select
on public.sales
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('vente', 'read')
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
  )
);

drop policy if exists sales_insert on public.sales;
create policy sales_insert
on public.sales
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    seller_id is null
    or seller_id = auth.uid()
    or public.is_admin_role()
  )
  and public.user_has_module_permission('vente', 'create')
);

drop policy if exists sales_update on public.sales;
create policy sales_update
on public.sales
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
    or public.user_can_delete_vente_rls()
  )
)
with check (
  (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
    or public.user_can_delete_vente_rls()
  )
);

-- Pas de DELETE direct applicatif : passage obligatoire par RPC sécurisée / mise à jour (soft delete).
drop policy if exists sales_delete on public.sales;

-- ---------------------------------------------------------------------------
-- sale_items — ajouter UPDATE (historiquement absent ; évite blocages futurs)
-- ---------------------------------------------------------------------------

drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'read')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

drop policy if exists sale_items_insert on public.sale_items;
create policy sale_items_insert
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'create')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

drop policy if exists sale_items_update on public.sale_items;
create policy sale_items_update
on public.sale_items
for update
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'update')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
)
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'update')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

drop policy if exists sale_items_delete on public.sale_items;
create policy sale_items_delete
on public.sale_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'delete')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

-- ---------------------------------------------------------------------------
-- Produits — même logique que 023 (module produits + propriété ou admin)
-- ---------------------------------------------------------------------------

drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated
on public.products
for select
to authenticated
using (
  (
    deleted_at is null
    and public.user_has_module_permission('produits', 'read')
    and (public.is_admin_role() or created_by = auth.uid())
  )
  or (
    deleted_at is not null
    and (
      public.is_admin_role()
      or (
        public.user_can_delete_products_rls()
        and created_by = auth.uid()
      )
    )
  )
);

drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated
on public.products
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('produits', 'create')
);

drop policy if exists products_update_authenticated on public.products;
create policy products_update_authenticated
on public.products
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('produits', 'update')
    or public.user_has_module_permission('produits', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
)
with check (
  (
    public.user_has_module_permission('produits', 'update')
    or public.user_has_module_permission('produits', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
);

-- DELETE physique produits : pas de policy « permissive » (aucune suppression directe par JWT utilisateur).

-- ---------------------------------------------------------------------------
-- Dépenses — ajouter DELETE explicite (suppressions réelles réservées admin ou créateur avec permission)
-- ---------------------------------------------------------------------------

drop policy if exists expenses_select on public.expenses;
create policy expenses_select
on public.expenses
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('finance', 'read')
  and (public.is_admin_role() or created_by = auth.uid())
);

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert
on public.expenses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('finance', 'create')
);

drop policy if exists expenses_update on public.expenses;
create policy expenses_update
on public.expenses
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
)
with check (
  (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
);

drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete
on public.expenses
for delete
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('finance', 'delete')
  and (public.is_admin_role() or created_by = auth.uid())
);

-- ---------------------------------------------------------------------------
-- currency_rates — jeu unique : lecture tous les auth ; écriture réservée aux admins (canonique + super_admin)
-- ---------------------------------------------------------------------------

drop policy if exists currency_rates_select on public.currency_rates;
drop policy if exists currency_rates_select_authenticated on public.currency_rates;
drop policy if exists currency_rates_manage_super_admin on public.currency_rates;
drop policy if exists currency_rates_upsert on public.currency_rates;
drop policy if exists currency_rates_insert_admin on public.currency_rates;
drop policy if exists currency_rates_update_admin on public.currency_rates;
drop policy if exists currency_rates_delete_admin on public.currency_rates;

create policy currency_rates_select_authenticated
on public.currency_rates
for select
to authenticated
using (true);

create policy currency_rates_insert_admin
on public.currency_rates
for insert
to authenticated
with check (public.is_admin_role());

create policy currency_rates_update_admin
on public.currency_rates
for update
to authenticated
using (public.is_admin_role())
with check (public.is_admin_role());

create policy currency_rates_delete_admin
on public.currency_rates
for delete
to authenticated
using (public.is_admin_role());

commit;
