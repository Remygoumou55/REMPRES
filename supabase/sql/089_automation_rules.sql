-- ============================================
-- Automation Rules — règles métier + journal d'exécution
-- Run in Supabase SQL Editor (idempotent)
-- ============================================

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  description TEXT,
  trigger_type TEXT NOT NULL DEFAULT '',
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  condition_type TEXT,
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL DEFAULT '',
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS trigger_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS condition_type TEXT,
  ADD COLUMN IF NOT EXISTS condition_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS action_type TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS action_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'skipped')),
  error_message TEXT,
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_rules_active
  ON public.automation_rules(is_active)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auto_rules_trigger
  ON public.automation_rules(trigger_type)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_auto_logs_rule
  ON public.automation_execution_logs(rule_id);

CREATE INDEX IF NOT EXISTS idx_auto_logs_executed
  ON public.automation_execution_logs(executed_at DESC);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auto_rules_read" ON public.automation_rules;
CREATE POLICY "auto_rules_read"
  ON public.automation_rules FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('automation', 'read')
  );

DROP POLICY IF EXISTS "auto_rules_write" ON public.automation_rules;
CREATE POLICY "auto_rules_write"
  ON public.automation_rules FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('automation', 'create')
  );

DROP POLICY IF EXISTS "auto_logs_read" ON public.automation_execution_logs;
CREATE POLICY "auto_logs_read"
  ON public.automation_execution_logs FOR SELECT
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('automation', 'read')
  );

DROP POLICY IF EXISTS "auto_logs_write" ON public.automation_execution_logs;
CREATE POLICY "auto_logs_write"
  ON public.automation_execution_logs FOR ALL
  USING (public.is_super_admin());
