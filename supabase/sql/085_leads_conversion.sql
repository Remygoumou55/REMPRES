-- RemPres ERP — Colonnes conversion lead → client (idempotent)
-- Run in Supabase SQL Editor: supabase/sql/085_leads_conversion.sql

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_client_id UUID
    REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_converted_client
  ON public.leads(converted_client_id)
  WHERE deleted_at IS NULL AND converted_client_id IS NOT NULL;
