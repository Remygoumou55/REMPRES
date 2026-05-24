# RUNTIME E2E VALIDATION — Étape 5

**Verdict :** LOCKED

## Scénarios validés (automated evidence)

| Scénario | Preuve |
|----------|--------|
| SA `/dashboard` → SuperAdminCockpitClient | dashboard/page.tsx + cockpit-authority |
| Dept manager → `/dept/vente` | dept page + redirect legacy |
| Finance `/finance` → FinanceDashboardClient | cockpit surface finance_operational |
| Legacy `/vente/dashboard` | redirect `/dept/vente` |
| RBAC isolation | rbac-hard-lock-cert (26) |
| Route isolation | route-isolation-matrix (20) |
| Sidebar isolation | sidebar-isolation-matrix (8) |
| M3.75 SA lock | m3-75-final-lock (16) |

## Provider stack

`I18nProvider` → `QueryClientProvider` → `ToastProvider` → `CurrencyContextProvider` — unique.

## Super Admin

ErpNavSidebar + SuperAdminCockpitClient — **non modifiés** (certification matrix SA rows).
