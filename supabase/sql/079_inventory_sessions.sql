-- 079 — Inventaire périodique (sessions + lignes de comptage)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'completed', 'validated')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  total_items_counted INTEGER DEFAULT 0,
  total_discrepancies INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL
    REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL
    REFERENCES public.stock_items(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  sku TEXT,
  theoretical_quantity NUMERIC(18, 2) NOT NULL DEFAULT 0,
  counted_quantity NUMERIC(18, 2),
  discrepancy NUMERIC(18, 2)
    GENERATED ALWAYS AS (
      CASE
        WHEN counted_quantity IS NOT NULL
        THEN counted_quantity - theoretical_quantity
        ELSE NULL
      END
    ) STORED,
  unit TEXT DEFAULT 'unité',
  location TEXT,
  notes TEXT,
  counted_at TIMESTAMPTZ,
  counted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_lines_session
  ON public.inventory_lines(session_id);
CREATE INDEX IF NOT EXISTS idx_inv_sessions_status
  ON public.inventory_sessions(status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_sessions_read" ON public.inventory_sessions;
CREATE POLICY "inv_sessions_read"
  ON public.inventory_sessions FOR SELECT
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "inv_sessions_write" ON public.inventory_sessions;
CREATE POLICY "inv_sessions_write"
  ON public.inventory_sessions FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('logistics', 'create')
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.user_has_module_permission('logistics', 'create')
  );

DROP POLICY IF EXISTS "inv_lines_read" ON public.inventory_lines;
CREATE POLICY "inv_lines_read"
  ON public.inventory_lines FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "inv_lines_write" ON public.inventory_lines;
CREATE POLICY "inv_lines_write"
  ON public.inventory_lines FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('logistics', 'create')
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.user_has_module_permission('logistics', 'create')
  );

-- ► Safe to re-run: IF NOT EXISTS + DROP POLICY IF EXISTS.
