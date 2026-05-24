# NAV + COCKPIT CERTIFICATION — Étape 5

**Verdict :** CERTIFIED

## ONE NAV

| Rôle | Source | Composant |
|------|--------|-----------|
| Super Admin | `nav-config.ts` | ErpNavSidebar (gelé) |
| Département | `department-sidebar-nav.ts` | DepartmentBusinessSidebar |

Validation SA : `super-admin-nav.ts` (dérivé, pas de rendu parallèle).

## ONE COCKPIT OWNER

| Surface | Route | UI |
|---------|-------|-----|
| SA frozen | `/dashboard` | SuperAdminCockpitClient |
| Dept | `/dept/[slug]` | DeptHomePage |
| Finance ops | `/finance` | FinanceDashboardClient |
| Legacy | `/*/dashboard` | redirect → `/dept/*` |

Shadow cockpits : **absents** (VenteCockpitClient, placeholders supprimés).

Tests : `nav-cockpit-unification-matrix` (16) + certification matrix (cockpit rows).
