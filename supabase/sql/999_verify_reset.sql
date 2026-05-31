-- ================================================
-- REMPRES ERP — VÉRIFICATION APRÈS RESET
-- Exécuter après 999_reset_all_data.sql
-- ================================================

WITH business AS (
  SELECT 'clients' AS table_name, COUNT(*)::bigint AS remaining_rows FROM public.clients
  UNION ALL SELECT 'sales', COUNT(*) FROM public.sales
  UNION ALL SELECT 'sale_items', COUNT(*) FROM public.sale_items
  UNION ALL SELECT 'sales_archive', COUNT(*) FROM public.sales_archive
  UNION ALL SELECT 'products', COUNT(*) FROM public.products
  UNION ALL SELECT 'stock_movements', COUNT(*) FROM public.stock_movements
  UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
  UNION ALL SELECT 'financial_transactions', COUNT(*) FROM public.financial_transactions
  UNION ALL SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
  UNION ALL SELECT 'approval_requests', COUNT(*) FROM public.approval_requests
  UNION ALL SELECT 'notifications', COUNT(*) FROM public.notifications
  UNION ALL SELECT 'governance_alerts', COUNT(*) FROM public.governance_alerts
  UNION ALL SELECT 'governance_audit_events', COUNT(*) FROM public.governance_audit_events
  UNION ALL SELECT 'crm_leads', COUNT(*) FROM public.crm_leads
  UNION ALL SELECT 'quotes', COUNT(*) FROM public.quotes
  UNION ALL SELECT 'quote_items', COUNT(*) FROM public.quote_items
  UNION ALL SELECT 'crm_opportunities', COUNT(*) FROM public.crm_opportunities
  UNION ALL SELECT 'rh_leave_requests', COUNT(*) FROM public.rh_leave_requests
  UNION ALL SELECT 'rh_attendance_events', COUNT(*) FROM public.rh_attendance_events
  UNION ALL SELECT 'logistics_stock_movements', COUNT(*) FROM public.logistics_stock_movements
  UNION ALL SELECT 'logistics_inventory_balances', COUNT(*) FROM public.logistics_inventory_balances
  UNION ALL SELECT 'erp_analytics_snapshots', COUNT(*) FROM public.erp_analytics_snapshots
),
preserved AS (
  SELECT 'profiles (conservés)' AS table_name, COUNT(*)::bigint AS remaining_rows FROM public.profiles
  UNION ALL SELECT 'app_roles (conservés)', COUNT(*) FROM public.app_roles
  UNION ALL SELECT 'permissions (conservés)', COUNT(*) FROM public.permissions
  UNION ALL SELECT 'departments (conservés)', COUNT(*) FROM public.departments
  UNION ALL SELECT 'currency_rates (conservés)', COUNT(*) FROM public.currency_rates
  UNION ALL SELECT 'expense_categories (conservés)', COUNT(*) FROM public.expense_categories
  UNION ALL SELECT 'crm_pipeline_stages (conservés)', COUNT(*) FROM public.crm_pipeline_stages
),
all_counts AS (
  SELECT * FROM business
  UNION ALL
  SELECT * FROM preserved
),
summary AS (
  SELECT COALESCE(SUM(remaining_rows), 0) AS business_rows
  FROM business
)
SELECT
  a.table_name,
  a.remaining_rows,
  CASE
    WHEN a.table_name LIKE '%conservés%' THEN 'CONSERVÉ'
    WHEN a.remaining_rows = 0 THEN 'OK'
    ELSE 'NON VIDE'
  END AS status,
  CASE
    WHEN (SELECT business_rows FROM summary) = 0
    THEN '✅ RESET RÉUSSI'
    ELSE '⚠️ Des données métier subsistent'
  END AS message_global
FROM all_counts a
ORDER BY
  CASE WHEN a.table_name LIKE '%conservés%' THEN 1 ELSE 0 END,
  a.table_name;
