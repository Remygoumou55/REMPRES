-- ============================================
-- 094 — Quotes (Devis) — Workflow Devis→Facture
-- RemPres ERP · Run in Supabase SQL Editor
-- ============================================

-- ─── Sequence for auto quote numbers ─────────

CREATE SEQUENCE IF NOT EXISTS
  quote_seq START 1000;

-- ─── Function: generate quote number ─────────

CREATE OR REPLACE FUNCTION
  generate_quote_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DV-' || LPAD(
    nextval('quote_seq')::TEXT,
    4, '0'
  );
END;
$$ LANGUAGE plpgsql;

-- ─── Function: trigger to auto-set number ────

CREATE OR REPLACE FUNCTION
  set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL
  OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Main table: quotes ───────────────────────

CREATE TABLE IF NOT EXISTS
  public.quotes (
    id UUID PRIMARY KEY
      DEFAULT gen_random_uuid(),

    -- Auto-generated: DV-1000, DV-1001, etc.
    quote_number TEXT NOT NULL UNIQUE
      DEFAULT '',

    -- Client (nullable: can be prospect
    --  not yet in clients table)
    client_id UUID
      REFERENCES public.clients(id)
      ON DELETE SET NULL,

    -- Client info snapshot (in case client
    -- is deleted later — keep for audit trail)
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,

    -- Status workflow
    -- draft → sent → accepted → refused
    --      ↘ expired (if valid_until passed)
    -- accepted → converted (linked to sale)
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN (
        'draft',      -- Brouillon
        'sent',       -- Envoyé au client
        'accepted',   -- Accepté par le client
        'refused',    -- Refusé par le client
        'expired',    -- Date de validité dépassée
        'converted'   -- Converti en vente
      )),

    -- Validity
    valid_until DATE,

    -- Totals
    subtotal_gnf NUMERIC(18,2)
      NOT NULL DEFAULT 0,
    discount_gnf NUMERIC(18,2)
      NOT NULL DEFAULT 0,
    total_gnf NUMERIC(18,2)
      NOT NULL DEFAULT 0,

    -- Linked sale (set when converted)
    converted_to_sale_id UUID
      REFERENCES public.sales(id)
      ON DELETE SET NULL,
    converted_at TIMESTAMPTZ,
    converted_by UUID
      REFERENCES auth.users(id),

    -- Notes / conditions
    notes TEXT,
    payment_conditions TEXT
      DEFAULT 'Paiement à 30 jours',

    -- Tracking
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    refused_at TIMESTAMPTZ,
    refused_reason TEXT,

    -- Metadata
    created_by UUID
      REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  );

-- ─── Trigger: auto-set quote_number ──────────

DROP TRIGGER IF EXISTS trg_set_quote_number
  ON public.quotes;

CREATE TRIGGER trg_set_quote_number
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION
  set_quote_number();

-- ─── Table: quote_items ───────────────────────

CREATE TABLE IF NOT EXISTS
  public.quote_items (
    id UUID PRIMARY KEY
      DEFAULT gen_random_uuid(),

    quote_id UUID NOT NULL
      REFERENCES public.quotes(id)
      ON DELETE CASCADE,

    -- Optional link to existing product
    -- (NULL = free text item, not in catalog)
    product_id UUID
      REFERENCES public.products(id)
      ON DELETE SET NULL,

    -- Item details (snapshot at quote time)
    product_name TEXT NOT NULL,
    description TEXT,

    -- Pricing
    quantity INTEGER NOT NULL DEFAULT 1
      CHECK (quantity > 0),
    unit_price_gnf NUMERIC(18,2)
      NOT NULL DEFAULT 0
      CHECK (unit_price_gnf >= 0),

    -- Discount per line (percentage 0-100)
    discount_pct NUMERIC(5,2)
      NOT NULL DEFAULT 0
      CHECK (discount_pct BETWEEN 0 AND 100),

    -- Line total: qty * price * (1 - discount/100)
    -- GENERATED STORED = computed by PostgreSQL
    line_total_gnf NUMERIC(18,2)
      GENERATED ALWAYS AS (
        ROUND(
          quantity::numeric
          * unit_price_gnf
          * (1 - discount_pct / 100.0),
          2
        )
      ) STORED,

    -- Position for ordering items
    position INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- ─── Indexes ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quotes_client
  ON public.quotes(client_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_status
  ON public.quotes(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS
  idx_quotes_converted_sale
  ON public.quotes(converted_to_sale_id)
  WHERE converted_to_sale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_items_quote
  ON public.quote_items(quote_id);

CREATE INDEX IF NOT EXISTS
  idx_quotes_valid_until
  ON public.quotes(valid_until)
  WHERE status IN ('draft', 'sent')
    AND deleted_at IS NULL;

-- ─── RLS: quotes ──────────────────────────────

ALTER TABLE public.quotes
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quotes_read"
  ON public.quotes;
CREATE POLICY "quotes_read"
  ON public.quotes FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission(
      'vente', 'read'
    )
  );

DROP POLICY IF EXISTS "quotes_write"
  ON public.quotes;
CREATE POLICY "quotes_write"
  ON public.quotes FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission(
      'vente', 'create'
    )
  );

-- ─── RLS: quote_items ─────────────────────────

ALTER TABLE public.quote_items
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quote_items_read"
  ON public.quote_items;
CREATE POLICY "quote_items_read"
  ON public.quote_items FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission(
      'vente', 'read'
    )
  );

DROP POLICY IF EXISTS "quote_items_write"
  ON public.quote_items;
CREATE POLICY "quote_items_write"
  ON public.quote_items FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission(
      'vente', 'create'
    )
  );

-- ─── Comment ──────────────────────────────────

COMMENT ON TABLE public.quotes IS
  'Devis commerciaux RemPres.
   Workflow: draft→sent→accepted→converted(sale)
   quote_number auto-généré: DV-1000, DV-1001...
   line_total_gnf GENERATED STORED par PostgreSQL.';

COMMENT ON TABLE public.quote_items IS
  'Lignes de devis.
   line_total_gnf = qty * price * (1 - discount%)
   Calculé automatiquement par PostgreSQL.';

-- ─── Quick verification query ─────────────────
-- Run after migration to verify:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('quotes', 'quote_items');
-- Expected: 2 rows
