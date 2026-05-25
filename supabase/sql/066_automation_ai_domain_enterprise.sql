-- 066_automation_ai_domain_enterprise.sql
-- Bloc 3 Étape 7 — Automation + AI orchestration maturity (rule executions, multi-domain workflows).

begin;

-- ─── Historique exécutions règles (observability automation)
create table if not exists public.erp_automation_rule_executions (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  action_key text not null,
  event_id text not null,
  event_type text not null,
  entity_type text null,
  entity_id text null,
  outcome text not null check (outcome in ('executed', 'skipped_cooldown', 'skipped_no_match', 'error')),
  detail text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_erp_auto_rule_exec_rule on public.erp_automation_rule_executions(rule_key, created_at desc);
create index if not exists idx_erp_auto_rule_exec_event on public.erp_automation_rule_executions(event_id);
create index if not exists idx_erp_auto_rule_exec_outcome on public.erp_automation_rule_executions(outcome, created_at desc);

alter table public.erp_automation_rule_executions enable row level security;

drop policy if exists erp_auto_rule_exec_select on public.erp_automation_rule_executions;
create policy erp_auto_rule_exec_select on public.erp_automation_rule_executions
  for select to authenticated
  using (public.user_has_automation_module_permission('read'));

drop policy if exists erp_auto_rule_exec_insert on public.erp_automation_rule_executions;
create policy erp_auto_rule_exec_insert on public.erp_automation_rule_executions
  for insert to authenticated
  with check (public.user_has_automation_module_permission('create'));

-- ─── Workflows multi-domaines Bloc 3 (définitions versionnées)
insert into public.erp_automation_workflow_definitions (
  workflow_key, domain_key, label, description, definition, version, is_active, metadata
)
values
  (
    'bloc3.crm_deal_won_chain',
    'cross_domain',
    'Chaîne deal gagné',
    'CRM deal won → trace finance + ops (orchestration gouvernée)',
    '{"steps":[{"type":"audit_log","label":"deal_won_intake"},{"type":"noop","label":"finance_invoice_candidate"},{"type":"noop","label":"ops_task_bridge"}]}'::jsonb,
    1,
    true,
    '{"bloc":"3","step":"7","trigger":"crm.deal.won"}'::jsonb
  ),
  (
    'bloc3.supply_purchase_chain',
    'cross_domain',
    'Chaîne achat supply',
    'Demande achat → approbation → notification',
    '{"steps":[{"type":"audit_log","label":"purchase_requested"},{"type":"approval","label":"purchase_approval_gate"},{"type":"audit_log","label":"notify_procurement"}]}'::jsonb,
    1,
    true,
    '{"bloc":"3","step":"7","trigger":"supply.purchase.requested"}'::jsonb
  ),
  (
    'bloc3.executive_signal_chain',
    'executive',
    'Signal exécutif',
    'Signal raised → triage automation + AI decision support',
    '{"steps":[{"type":"audit_log","label":"signal_intake"},{"type":"noop","label":"ai_decision_support"}]}'::jsonb,
    1,
    true,
    '{"bloc":"3","step":"7","trigger":"executive.signal.raised"}'::jsonb
  ),
  (
    'bloc3.observability_health_chain',
    'observability',
    'Santé dégradée',
    'Health degraded → escalation trace + executive alert candidate',
    '{"steps":[{"type":"audit_log","label":"health_degraded_intake"},{"type":"noop","label":"executive_alert_candidate"}]}'::jsonb,
    1,
    true,
    '{"bloc":"3","step":"7","trigger":"observability.health.degraded"}'::jsonb
  )
on conflict (workflow_key) do update
set
  label = excluded.label,
  description = excluded.description,
  definition = excluded.definition,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

commit;
