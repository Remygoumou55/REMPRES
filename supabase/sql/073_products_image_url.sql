-- =============================================================================
-- 073 — Product image upload
-- =============================================================================
-- Garantit que la table products possède bien image_url (déjà présent depuis 004,
-- mais on rejoue l'instruction en IF NOT EXISTS pour rester idempotent), puis
-- crée le bucket Storage "products" et ses policies RLS associées.
-- A exécuter dans le SQL Editor Supabase avant de tester l'upload d'image.
-- =============================================================================

-- 1. Colonne image_url (no-op si déjà présente depuis 004_products_schema.sql)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Bucket Storage public "products"
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policies RLS — chaque policy est recréée proprement pour rester idempotent.

-- 3.1 INSERT — utilisateurs authentifiés peuvent uploader dans le bucket products
DROP POLICY IF EXISTS "Product images upload" ON storage.objects;
CREATE POLICY "Product images upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products');

-- 3.2 SELECT — lecture publique (catalogue, POS, factures)
DROP POLICY IF EXISTS "Product images public view" ON storage.objects;
CREATE POLICY "Product images public view"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'products');

-- 3.3 UPDATE — utilisateurs authentifiés peuvent remplacer (upsert)
DROP POLICY IF EXISTS "Product images update" ON storage.objects;
CREATE POLICY "Product images update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products');

-- 3.4 DELETE — utilisateurs authentifiés peuvent supprimer
DROP POLICY IF EXISTS "Product images delete" ON storage.objects;
CREATE POLICY "Product images delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'products');
