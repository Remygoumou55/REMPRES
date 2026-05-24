-- ================================================
-- REMPRES ERP — VÉRIFICATION APRÈS RESET
-- Exécuter après 999_reset_all_data.sql
-- ================================================

-- Comptages métier (attendu : 0)
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
UNION ALL SELECT 'governance_alerts', COUNT(*) FROM public.governance_alerts
UNION ALL SELECT 'governance_audit_events', COUNT(*) FROM public.governance_audit_events
UNION ALL SELECT 'crm_leads', COUNT(*) FROM public.crm_leads
UNION ALL SELECT 'crm_quotes', COUNT(*) FROM public.crm_quotes
UNION ALL SELECT 'crm_opportunities', COUNT(*) FROM public.crm_opportunities
UNION ALL SELECT 'rh_leave_requests', COUNT(*) FROM public.rh_leave_requests
UNION ALL SELECT 'rh_attendance_events', COUNT(*) FROM public.rh_attendance_events
UNION ALL SELECT 'logistics_stock_movements', COUNT(*) FROM public.logistics_stock_movements
UNION ALL SELECT 'logistics_inventory_balances', COUNT(*) FROM public.logistics_inventory_balances
UNION ALL SELECT 'erp_analytics_snapshots', COUNT(*) FROM public.erp_analytics_snapshots
ORDER BY table_name;

-- Tables conservées (attendu : > 0 pour profiles et currency_rates)
SELECT 'profiles (conservés)' AS table_name, COUNT(*)::bigint AS remaining_rows FROM public.profiles
UNION ALL SELECT 'app_roles (conservés)', COUNT(*) FROM public.app_roles
UNION ALL SELECT 'permissions (conservés)', COUNT(*) FROM public.permissions
UNION ALL SELECT 'departments (conservés)', COUNT(*) FROM public.departments
UNION ALL SELECT 'currency_rates (conservés)', COUNT(*) FROM public.currency_rates
UNION ALL SELECT 'expense_categories (conservés)', COUNT(*) FROM public.expense_categories
UNION ALL SELECT 'crm_pipeline_stages (conservés)', COUNT(*) FROM public.crm_pipeline_stages
ORDER BY table_name;

-- Résultat attendu (résumé) :
-- clients, sales, products, expenses, activity_logs, … → 0
-- profiles, currency_rates, app_roles, permissions → > 0
