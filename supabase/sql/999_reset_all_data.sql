-- ================================================
-- REMPRES ERP — RESET COMPLET DES DONNÉES MÉTIER
-- Date : 24 Mai 2026
-- ⚠️ IRRÉVERSIBLE — Exécuter avec précaution
--
-- Effet : supprime toutes les lignes des tables métier /
-- opérationnelles pour remettre les KPI à zéro.
--
-- CONSERVÉ (non touché) :
--   profiles, app_roles, permissions, departments
--   currency_rates, currencies, expense_categories
--   crm_pipeline_stages (référentiel pipeline)
--   auth.users (comptes Supabase Auth)
--
-- Exécution : Supabase → SQL Editor → coller tout → Run
-- ================================================

BEGIN;

SET session_replication_role = replica;

-- ── Helper : DELETE si la table existe ─────────
CREATE OR REPLACE FUNCTION pg_temp.reset_delete_table(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_regclass('public.' || p_table) IS NOT NULL THEN
    EXECUTE format('DELETE FROM public.%I', p_table);
  END IF;
END;
$$;

-- ── NOTIFICATIONS & GOUVERNANCE (avant approvals FK) ─
SELECT pg_temp.reset_delete_table('notifications');
SELECT pg_temp.reset_delete_table('governance_audit_events');
SELECT pg_temp.reset_delete_table('governance_alerts');

-- RH (référence approval_requests)
SELECT pg_temp.reset_delete_table('rh_recruitment_onboarding');
SELECT pg_temp.reset_delete_table('rh_recruitment_history');
SELECT pg_temp.reset_delete_table('rh_recruitment_documents');
SELECT pg_temp.reset_delete_table('rh_recruitment_evaluations');
SELECT pg_temp.reset_delete_table('rh_recruitment_interviews');
SELECT pg_temp.reset_delete_table('rh_recruitment_candidates');
SELECT pg_temp.reset_delete_table('rh_contract_history');
SELECT pg_temp.reset_delete_table('rh_contract_documents');
SELECT pg_temp.reset_delete_table('rh_employee_contracts');
SELECT pg_temp.reset_delete_table('rh_employee_hierarchy');
SELECT pg_temp.reset_delete_table('rh_employee_history');
SELECT pg_temp.reset_delete_table('rh_employee_documents');
SELECT pg_temp.reset_delete_table('rh_leave_requests');
SELECT pg_temp.reset_delete_table('rh_attendance_events');

-- Finance enterprise (avant clients / approvals)
SELECT pg_temp.reset_delete_table('finance_payment_allocations');
SELECT pg_temp.reset_delete_table('finance_ar_invoice_lines');
SELECT pg_temp.reset_delete_table('finance_ar_invoices');
SELECT pg_temp.reset_delete_table('finance_journal_lines');
SELECT pg_temp.reset_delete_table('finance_journal_batches');
SELECT pg_temp.reset_delete_table('finance_budget_lines');
SELECT pg_temp.reset_delete_table('finance_budgets');
SELECT pg_temp.reset_delete_table('finance_cashflow_daily');

-- CRM (avant clients / ventes)
SELECT pg_temp.reset_delete_table('crm_forecast_snapshots');
SELECT pg_temp.reset_delete_table('crm_activities');
SELECT pg_temp.reset_delete_table('crm_quote_lines');
SELECT pg_temp.reset_delete_table('crm_quotes');
SELECT pg_temp.reset_delete_table('crm_opportunities');
SELECT pg_temp.reset_delete_table('crm_leads');

-- Logistique
SELECT pg_temp.reset_delete_table('logistics_delivery_lines');
SELECT pg_temp.reset_delete_table('logistics_delivery_orders');
SELECT pg_temp.reset_delete_table('logistics_goods_receipt_lines');
SELECT pg_temp.reset_delete_table('logistics_goods_receipts');
SELECT pg_temp.reset_delete_table('logistics_stock_movements');
SELECT pg_temp.reset_delete_table('logistics_inventory_balances');
SELECT pg_temp.reset_delete_table('logistics_purchase_order_lines');
SELECT pg_temp.reset_delete_table('logistics_purchase_orders');
SELECT pg_temp.reset_delete_table('logistics_suppliers');
SELECT pg_temp.reset_delete_table('logistics_warehouses');

-- ── VENTE / COMMERCE ───────────────────────────
DELETE FROM public.sale_items;
DELETE FROM public.sales_archive;
DELETE FROM public.sales;
DELETE FROM public.stock_movements;
DELETE FROM public.products;
DELETE FROM public.clients;

-- ── FINANCE (transactions & dépenses) ──────────
DELETE FROM public.expenses;
DELETE FROM public.financial_transactions;
-- Plan comptable : données de config possible — décommenter si reset total finance :
-- DELETE FROM public.finance_accounts;

-- ── APPROVALS (après tables FK) ────────────────
DELETE FROM public.approval_requests;

-- ── MODULES LEGACY / FUTURS (si tables présentes) ─
SELECT pg_temp.reset_delete_table('deliverables');
SELECT pg_temp.reset_delete_table('mission_phases');
SELECT pg_temp.reset_delete_table('appointments');
SELECT pg_temp.reset_delete_table('missions');
SELECT pg_temp.reset_delete_table('leads');
SELECT pg_temp.reset_delete_table('campaigns');
SELECT pg_temp.reset_delete_table('certificates');
SELECT pg_temp.reset_delete_table('enrollments');
SELECT pg_temp.reset_delete_table('trainees');
SELECT pg_temp.reset_delete_table('training_sessions');
SELECT pg_temp.reset_delete_table('trainings');
SELECT pg_temp.reset_delete_table('employees');
SELECT pg_temp.reset_delete_table('leave_requests');
SELECT pg_temp.reset_delete_table('attendance');
SELECT pg_temp.reset_delete_table('stock_movements_logistique');
SELECT pg_temp.reset_delete_table('stock_items');
SELECT pg_temp.reset_delete_table('product_categories');

-- ── ANALYTICS & JOURNAUX ───────────────────────
SELECT pg_temp.reset_delete_table('erp_analytics_snapshots');
SELECT pg_temp.reset_delete_table('logs');
DELETE FROM public.activity_logs;

-- ── ERP ENTERPRISE — DONNÉES RUNTIME (KPI / ops) ─
SELECT pg_temp.reset_delete_table('erp_ai_assistant_events');
SELECT pg_temp.reset_delete_table('erp_ai_forecast_artifacts');
SELECT pg_temp.reset_delete_table('erp_ai_pipeline_runs');
SELECT pg_temp.reset_delete_table('erp_ai_recommendations');
SELECT pg_temp.reset_delete_table('erp_ai_insights');
SELECT pg_temp.reset_delete_table('erp_observability_predictions');
SELECT pg_temp.reset_delete_table('erp_observability_correlations');
SELECT pg_temp.reset_delete_table('erp_observability_trace_events');
SELECT pg_temp.reset_delete_table('erp_observability_anomalies');
SELECT pg_temp.reset_delete_table('erp_observability_incidents');
SELECT pg_temp.reset_delete_table('erp_observability_health_snapshots');
SELECT pg_temp.reset_delete_table('erp_compliance_export_manifests');
SELECT pg_temp.reset_delete_table('erp_compliance_legal_traces');
SELECT pg_temp.reset_delete_table('erp_compliance_risk_signals');
SELECT pg_temp.reset_delete_table('erp_compliance_snapshots');
SELECT pg_temp.reset_delete_table('erp_compliance_fiscal_locks');
SELECT pg_temp.reset_delete_table('erp_compliance_accounting_periods');
SELECT pg_temp.reset_delete_table('erp_infrastructure_jobs');
SELECT pg_temp.reset_delete_table('erp_automation_escalations');
SELECT pg_temp.reset_delete_table('erp_automation_events');
SELECT pg_temp.reset_delete_table('erp_automation_workflow_runs');
SELECT pg_temp.reset_delete_table('erp_automation_schedules');
SELECT pg_temp.reset_delete_table('erp_cloud_operations_events');
SELECT pg_temp.reset_delete_table('erp_cloud_recovery_checkpoints');
SELECT pg_temp.reset_delete_table('erp_tenant_orchestration_events');
SELECT pg_temp.reset_delete_table('erp_tenant_recovery_checkpoints');
SELECT pg_temp.reset_delete_table('erp_tenant_analytics_snapshots');
SELECT pg_temp.reset_delete_table('erp_ecosystem_federation_events');
SELECT pg_temp.reset_delete_table('erp_governance_platform_operations_events');
SELECT pg_temp.reset_delete_table('erp_governance_maturity_snapshots');
SELECT pg_temp.reset_delete_table('erp_governance_technical_debt_entries');
SELECT pg_temp.reset_delete_table('erp_governance_board_topics');
SELECT pg_temp.reset_delete_table('erp_governance_architecture_decisions');
SELECT pg_temp.reset_delete_table('erp_resilience_platform_operations_events');
SELECT pg_temp.reset_delete_table('erp_resilience_metric_snapshots');
SELECT pg_temp.reset_delete_table('erp_resilience_validation_runs');
SELECT pg_temp.reset_delete_table('erp_resilience_scenarios');

DROP FUNCTION pg_temp.reset_delete_table(text);

SET session_replication_role = DEFAULT;

COMMIT;

-- ── VÉRIFICATION (messages NOTICE) ─────────────
DO $$
DECLARE
  v_clients      integer;
  v_sales        integer;
  v_products     integer;
  v_expenses     integer;
  v_logs         integer;
  v_crm_leads    integer;
  v_approvals    integer;
  v_profiles     integer;
  v_rates        integer;
BEGIN
  SELECT COUNT(*) INTO v_clients  FROM public.clients;
  SELECT COUNT(*) INTO v_sales    FROM public.sales;
  SELECT COUNT(*) INTO v_products FROM public.products;
  SELECT COUNT(*) INTO v_expenses FROM public.expenses;
  SELECT COUNT(*) INTO v_logs     FROM public.activity_logs;
  SELECT COUNT(*) INTO v_profiles FROM public.profiles;
  SELECT COUNT(*) INTO v_rates    FROM public.currency_rates;

  v_crm_leads := 0;
  IF to_regclass('public.crm_leads') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_crm_leads FROM public.crm_leads;
  END IF;

  v_approvals := 0;
  IF to_regclass('public.approval_requests') IS NOT NULL THEN
    SELECT COUNT(*) INTO v_approvals FROM public.approval_requests;
  END IF;

  RAISE NOTICE '=== RÉSULTAT DU RESET ===';
  RAISE NOTICE 'Clients restants       : %', v_clients;
  RAISE NOTICE 'Ventes restantes       : %', v_sales;
  RAISE NOTICE 'Produits restants      : %', v_products;
  RAISE NOTICE 'Dépenses restantes     : %', v_expenses;
  RAISE NOTICE 'Logs activité restants : %', v_logs;
  RAISE NOTICE 'Leads CRM restants     : %', v_crm_leads;
  RAISE NOTICE 'Approvals restantes    : %', v_approvals;
  RAISE NOTICE 'Profiles (conservés)   : %', v_profiles;
  RAISE NOTICE 'Taux de change (cons.) : %', v_rates;

  IF v_clients = 0 AND v_sales = 0 AND v_products = 0
     AND v_expenses = 0 AND v_logs = 0 AND v_crm_leads = 0 AND v_approvals = 0 THEN
    RAISE NOTICE '✅ RESET RÉUSSI — Application à zéro (comptes & config conservés)';
  ELSE
    RAISE WARNING '⚠️ Certaines tables métier ne sont pas vides — voir 999_verify_reset.sql';
  END IF;
END $$;
