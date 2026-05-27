-- RemPres ERP — Métriques analytics campagnes marketing
-- Run in Supabase SQL Editor: supabase/sql/084_campaigns_analytics.sql

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS sent_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_channel
  ON public.campaigns(channel)
  WHERE deleted_at IS NULL;
