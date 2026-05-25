-- ================================================
-- REMPRES ERP — RESET COMPLET DES DONNÉES MÉTIER
-- Date : 24 Mai 2026 (v2 — compatible Supabase SQL Editor)
-- ⚠️ IRRÉVERSIBLE — Exécuter avec précaution
--
-- IMPORTANT : sélectionner TOUT le fichier (Ctrl+A) puis Run.
-- Le dernier SELECT affiche le bilan dans l'onglet Results.
--
-- CONSERVÉ : profiles, app_roles, permissions, departments,
--   currency_rates, currencies, expense_categories,
--   crm_pipeline_stages, auth.users
-- ================================================

BEGIN;

SET session_replication_role = replica;

DO $reset$
DECLARE
  t text;
  optional_tables text[] := ARRAY[
    -- Notifications & gouvernance
    'notifications',
    'governance_audit_events',
    'governance_alerts',
    -- RH
    'rh_recruitment_onboarding',
    'rh_recruitment_history',
    'rh_recruitment_documents',
    'rh_recruitment_evaluations',
    'rh_recruitment_interviews',
    'rh_recruitment_candidates',
    'rh_contract_history',
    'rh_contract_documents',
    'rh_employee_contracts',
    'rh_employee_hierarchy',
    'rh_employee_history',
    'rh_employee_documents',
    'rh_leave_requests',
    'rh_attendance_events',
    -- Finance enterprise
    'finance_payment_allocations',
    'finance_ar_invoice_lines',
    'finance_ar_invoices',
    'finance_journal_lines',
    'finance_journal_batches',
    'finance_budget_lines',
    'finance_budgets',
    'finance_cashflow_daily',
    -- CRM
    'crm_forecast_snapshots',
    'crm_activities',
    'crm_quote_lines',
    'crm_quotes',
    'crm_opportunities',
    'crm_leads',
    -- Logistique
    'logistics_delivery_lines',
    'logistics_delivery_orders',
    'logistics_goods_receipt_lines',
    'logistics_goods_receipts',
    'logistics_stock_movements',
    'logistics_inventory_balances',
    'logistics_purchase_order_lines',
    'logistics_purchase_orders',
    'logistics_suppliers',
    'logistics_warehouses',
    -- Legacy / futur
    'deliverables',
    'mission_phases',
    'appointments',
    'missions',
    'leads',
    'campaigns',
    'certificates',
    'enrollments',
    'trainees',
    'training_sessions',
    'trainings',
    'employees',
    'leave_requests',
    'attendance',
    'stock_movements_logistique',
    'stock_items',
    'product_categories',
    -- Analytics & ERP runtime
    'erp_analytics_snapshots',
    'logs',
    'erp_ai_assistant_events',
    'erp_ai_forecast_artifacts',
    'erp_ai_pipeline_runs',
    'erp_ai_recommendations',
    'erp_ai_insights',
    'erp_observability_predictions',
    'erp_observability_correlations',
    'erp_observability_trace_events',
    'erp_observability_anomalies',
    'erp_observability_incidents',
    'erp_observability_health_snapshots',
    'erp_compliance_export_manifests',
    'erp_compliance_legal_traces',
    'erp_compliance_risk_signals',
    'erp_compliance_snapshots',
    'erp_compliance_fiscal_locks',
    'erp_compliance_accounting_periods',
    'erp_infrastructure_jobs',
    'erp_platform_connector_logs',
    'erp_platform_connector_instances',
    'erp_platform_integration_definitions',
    'erp_platform_api_audit_log',
    'erp_platform_api_registry',
    'erp_platform_external_event_outbox',
    'erp_platform_partner_connections',
    'erp_platform_plugin_installations',
    'erp_platform_catalog_plugins',
    'erp_automation_escalations',
    'erp_automation_events',
    'erp_automation_rule_executions',
    'erp_automation_workflow_runs',
    'erp_automation_schedules',
    'erp_cloud_operations_events',
    'erp_cloud_recovery_checkpoints',
    'erp_tenant_orchestration_events',
    'erp_tenant_recovery_checkpoints',
    'erp_tenant_analytics_snapshots',
    'erp_ecosystem_federation_events',
    'erp_governance_platform_operations_events',
    'erp_governance_maturity_snapshots',
    'erp_governance_technical_debt_entries',
    'erp_governance_board_topics',
    'erp_governance_architecture_decisions',
    'erp_resilience_platform_operations_events',
    'erp_resilience_metric_snapshots',
    'erp_resilience_validation_runs',
    'erp_resilience_scenarios'
  ];
BEGIN
  FOREACH t IN ARRAY optional_tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I', t);
    END IF;
  END LOOP;
END;
$reset$;

-- Tables cœur (toujours présentes)
TRUNCATE TABLE
  public.sale_items,
  public.sales_archive,
  public.sales,
  public.stock_movements,
  public.products,
  public.clients,
  public.expenses,
  public.financial_transactions,
  public.activity_logs,
  public.approval_requests
RESTART IDENTITY CASCADE;

SET session_replication_role = DEFAULT;

COMMIT;

-- ── BILAN (visible dans l'onglet Results) ──────
WITH counts AS (
  SELECT 'clients' AS table_name, COUNT(*)::bigint AS remaining_rows FROM public.clients
  UNION ALL SELECT 'sales', COUNT(*) FROM public.sales
  UNION ALL SELECT 'products', COUNT(*) FROM public.products
  UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
  UNION ALL SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
  UNION ALL SELECT 'approval_requests', COUNT(*) FROM public.approval_requests
  UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
  UNION ALL SELECT 'crm_leads', COUNT(*) FROM public.crm_leads
  UNION ALL SELECT 'governance_alerts', COUNT(*) FROM public.governance_alerts
  UNION ALL SELECT 'profiles (conservés)', COUNT(*) FROM public.profiles
  UNION ALL SELECT 'currency_rates (conservés)', COUNT(*) FROM public.currency_rates
),
summary AS (
  SELECT COALESCE(SUM(remaining_rows), 0) AS business_rows
  FROM counts
  WHERE table_name NOT LIKE '%conservés%'
)
SELECT
  c.table_name,
  c.remaining_rows,
  CASE
    WHEN c.table_name LIKE '%conservés%' THEN '—'
    WHEN c.remaining_rows = 0 THEN 'OK'
    ELSE 'NON VIDE'
  END AS status,
  s.business_rows AS total_lignes_metier_restantes,
  CASE
    WHEN s.business_rows = 0 THEN '✅ RESET RÉUSSI — Application à zéro'
    ELSE '⚠️ Relancer le script entier (Ctrl+A) ou exécuter 999_verify_reset.sql'
  END AS message_global
FROM counts c
CROSS JOIN summary s
ORDER BY
  CASE WHEN c.table_name LIKE '%conservés%' THEN 1 ELSE 0 END,
  c.table_name;
