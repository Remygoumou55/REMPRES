-- RemPres ERP — Rapprochement bancaire (idempotent)
-- Run in Supabase SQL Editor: supabase/sql/086_bank_reconciliation.sql

CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  system_balance_gnf NUMERIC(18, 2) NOT NULL DEFAULT 0,
  bank_balance_gnf NUMERIC(18, 2),
  discrepancy_gnf NUMERIC(18, 2) GENERATED ALWAYS AS (
    CASE
      WHEN bank_balance_gnf IS NOT NULL
      THEN bank_balance_gnf - system_balance_gnf
      ELSE NULL
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_progress', 'validated')),
  notes TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (month, year)
);

CREATE INDEX IF NOT EXISTS idx_bank_rec_period
  ON public.bank_reconciliations (year, month);

ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_rec_read" ON public.bank_reconciliations;
CREATE POLICY "bank_rec_read"
  ON public.bank_reconciliations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "bank_rec_write" ON public.bank_reconciliations;
CREATE POLICY "bank_rec_write"
  ON public.bank_reconciliations FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('finance', 'create')
  );
