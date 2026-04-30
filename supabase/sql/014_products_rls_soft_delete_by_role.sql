-- RemPres ERP — Soft-delete produit : aligner RLS avec le droit métier can_delete
--
-- Problème : la politique 013 exigeait created_by = auth.uid() pour tout UPDATE.
-- Un rôle avec can_delete (sans être créateur) ne pouvait pas archiver un produit → échec RLS silencieux ou erreur.
--
-- Correction : autoriser l’UPDATE (dont soft delete) si super_admin, ou créateur de la ligne,
-- ou utilisateur avec can_delete sur module produits/vente — tout en gardant user_can_mutate_product_row().
-- Aucun changement de schéma (tables/colonnes).
--
-- À exécuter dans Supabase SQL Editor après 013_products_rls_hardening.sql

drop policy if exists products_update_authenticated on public.products;

create policy products_update_authenticated
on public.products
for update
to authenticated
using (
  deleted_at is null
  and (
    public.is_super_admin()
    or public.user_can_delete_products_rls()
    or created_by = auth.uid()
  )
  and public.user_can_mutate_product_row()
)
with check (
  (
    public.is_super_admin()
    or public.user_can_delete_products_rls()
    or created_by = auth.uid()
  )
  and public.user_can_mutate_product_row()
);
