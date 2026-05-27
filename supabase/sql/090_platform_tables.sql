-- Ensure api_registry table has all columns
ALTER TABLE public.erp_platform_api_registry
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS endpoint_url TEXT,
  ADD COLUMN IF NOT EXISTS api_type TEXT NOT NULL DEFAULT 'internal'
    CHECK (api_type IN ('internal', 'external', 'webhook')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'deprecated')),
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'none'
    CHECK (auth_type IN ('none', 'api_key', 'bearer', 'oauth2')),
  ADD COLUMN IF NOT EXISTS rate_limit_per_hour INTEGER DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Ensure connectors table has all columns
ALTER TABLE public.erp_platform_connector_instances
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_type TEXT NOT NULL DEFAULT 'other'
    CHECK (service_type IN (
      'whatsapp', 'email', 'sms', 'google', 'microsoft', 'slack',
      'resend', 'orange_money', 'mtn_money', 'other'
    )),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'inactive', 'error', 'pending')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_api_status
  ON public.erp_platform_api_registry(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_connector_status
  ON public.erp_platform_connector_instances(status)
  WHERE deleted_at IS NULL;
