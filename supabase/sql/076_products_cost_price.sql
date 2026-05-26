-- RemPres ERP — Prix d'achat + marge automatique (produits)
-- Run in Supabase SQL Editor:
--   supabase/sql/076_products_cost_price.sql

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS
  cost_price_gnf NUMERIC(18,2) DEFAULT NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS
  margin_pct NUMERIC(5,2)
  GENERATED ALWAYS AS (
    CASE
      WHEN cost_price_gnf IS NOT NULL
        AND price_gnf IS NOT NULL
        AND price_gnf > 0
      THEN ROUND(
        (price_gnf - cost_price_gnf)
        / price_gnf * 100, 2
      )
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_margin
  ON public.products(margin_pct)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.products.cost_price_gnf IS 'Prix d''achat (GNF), optionnel — sert au calcul de marge.';
COMMENT ON COLUMN public.products.margin_pct IS 'Marge % = (price_gnf - cost_price_gnf) / price_gnf * 100, calculée automatiquement.';

-- Si GENERATED ALWAYS AS échoue sur votre instance, exécutez le bloc trigger ci-dessous
-- à la place (après avoir supprimé la colonne margin_pct générée le cas échéant).

/*
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS
  cost_price_gnf NUMERIC(18,2) DEFAULT NULL;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS
  margin_pct NUMERIC(5,2) DEFAULT NULL;

CREATE OR REPLACE FUNCTION public.compute_product_margin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price_gnf IS NOT NULL
     AND NEW.price_gnf > 0
     AND NEW.cost_price_gnf IS NOT NULL THEN
    NEW.margin_pct := ROUND(
      (NEW.price_gnf - NEW.cost_price_gnf)
      / NEW.price_gnf * 100, 2
    );
  ELSE
    NEW.margin_pct := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_margin ON public.products;
CREATE TRIGGER trg_product_margin
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_product_margin();

CREATE INDEX IF NOT EXISTS idx_products_margin
  ON public.products(margin_pct)
  WHERE deleted_at IS NULL;
*/
