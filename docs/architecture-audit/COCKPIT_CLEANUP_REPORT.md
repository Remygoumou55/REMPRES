# COCKPIT CLEANUP REPORT — Bloc 2 Étape 2

## Topology post-cleanup

```
SA (gelé)     /dashboard → SuperAdminCockpitClient
Métier        /dept/[key] → DeptHomePage ← getDeptDashboardData
Legacy redirect /vente/dashboard → /dept/vente
```

## Supprimé

- `DepartmentDashboardPage`, `DepartmentCockpitPlaceholder`
- `VenteCockpitClient`, `FinanceCockpitClient`
- `DeptDashboardClient`, `DashboardClient`, `dept-dashboard-shell`

## Conservé (contrats)

- `lib/vente/runtime/vente-cockpit-payload.ts`
- `lib/finance/runtime/finance-cockpit-payload.ts`
- `lib/server/dept-dashboard.ts` (runtime officiel)
