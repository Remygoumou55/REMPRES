-- Runtime Safety — fonctions atomiques et webhook entrant (service role)
-- Run in Supabase SQL Editor (idempotent)

CREATE OR REPLACE FUNCTION public.increment_webhook_delivery_stats(
  p_webhook_id UUID,
  p_failed BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.webhooks
  SET
    delivery_count = COALESCE(delivery_count, 0) + 1,
    failure_count = COALESCE(failure_count, 0) + CASE WHEN p_failed THEN 1 ELSE 0 END,
    last_triggered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_webhook_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_automation_rule_execution(
  p_rule_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.automation_rules
  SET
    execution_count = COALESCE(execution_count, 0) + 1,
    last_executed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_rule_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_incoming_webhook_by_token(p_token TEXT)
RETURNS SETOF public.webhooks
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.webhooks
  WHERE secret_token = p_token
    AND direction = 'incoming'
    AND is_active = TRUE
    AND deleted_at IS NULL
  LIMIT 1;
$$;
