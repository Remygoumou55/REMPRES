-- ============================================
-- Webhooks — Entrants et sortants
-- Run in Supabase SQL Editor (idempotent)
-- ============================================

CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  target_url TEXT,
  secret_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] DEFAULT '{}',
  http_method TEXT DEFAULT 'POST' CHECK (http_method IN ('POST', 'GET', 'PUT', 'PATCH')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  delivery_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  event_type TEXT,
  payload JSONB DEFAULT '{}',
  response_body TEXT,
  response_code INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'delivered', 'failed', 'received')),
  error_message TEXT,
  duration_ms INTEGER,
  delivered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_direction
  ON public.webhooks(direction)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_webhooks_token
  ON public.webhooks(secret_token)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deliveries_webhook
  ON public.webhook_deliveries(webhook_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_date
  ON public.webhook_deliveries(delivered_at DESC);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhooks_read" ON public.webhooks;
CREATE POLICY "webhooks_read"
  ON public.webhooks FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('platform', 'read')
  );

DROP POLICY IF EXISTS "webhooks_write" ON public.webhooks;
CREATE POLICY "webhooks_write"
  ON public.webhooks FOR ALL
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "deliveries_read" ON public.webhook_deliveries;
CREATE POLICY "deliveries_read"
  ON public.webhook_deliveries FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('platform', 'read')
  );

DROP POLICY IF EXISTS "deliveries_write" ON public.webhook_deliveries;
CREATE POLICY "deliveries_write"
  ON public.webhook_deliveries FOR ALL
  USING (public.is_super_admin());
