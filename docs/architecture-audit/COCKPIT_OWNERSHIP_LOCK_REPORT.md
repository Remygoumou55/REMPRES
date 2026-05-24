# COCKPIT OWNERSHIP LOCK — Étape 3

| Kind | Route | UI | Data |
|------|-------|-----|------|
| super_admin_frozen | /dashboard | SuperAdminCockpitClient | super-admin-cockpit.ts |
| department_home | /dept/[slug] | DeptHomePage | dept-dashboard.ts |
| finance_operational | /finance | FinanceDashboardClient | finance-overview.ts |
| legacy_dashboard_redirect | /*/dashboard | redirect | dept-cockpit-route |

**Module :** `cockpit-authority.ts`
