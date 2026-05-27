-- ============================================
-- Purchase Orders — Commandes fournisseurs
-- ============================================

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'received', 'cancelled')),
  expected_delivery_date DATE,
  received_at TIMESTAMPTZ,
  total_gnf NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  confirmed_by UUID REFERENCES auth.users(id),
  received_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  stock_item_id UUID REFERENCES public.stock_items(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_received INTEGER DEFAULT 0,
  unit_price_gnf NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_gnf NUMERIC(18,2) GENERATED ALWAYS AS (quantity_ordered * unit_price_gnf) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CMD-' || LPAD(nextval('purchase_order_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.purchase_orders;

CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
  ON public.purchase_orders(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier
  ON public.purchase_orders(supplier_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_poi_order_id
  ON public.purchase_order_items(purchase_order_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "po_read" ON public.purchase_orders;
CREATE POLICY "po_read"
  ON public.purchase_orders FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "po_write" ON public.purchase_orders;
CREATE POLICY "po_write"
  ON public.purchase_orders FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('logistique', 'create')
  );

DROP POLICY IF EXISTS "poi_read" ON public.purchase_order_items;
CREATE POLICY "poi_read"
  ON public.purchase_order_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "poi_write" ON public.purchase_order_items;
CREATE POLICY "poi_write"
  ON public.purchase_order_items FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('logistique', 'create')
  );
