# DEPENDENCY REPORT — Bloc 2 Étape 1

**Date :** 22 mai 2026

## Dependency map (runtime-critical)

```
profiles (Supabase)
  → getCachedProfileRow / profile-authority
    → layout-access (cache React)
      → AppShell
        → sidebar-for-role → sidebar-authority
        → shell-visibility / shellRail
      → middleware (edge-route-guards)
        → route-authority / permissions
```

## Cross-module coupling (observé)

| From | To | Type | Risk |
|------|-----|------|------|
| `app/(app)/layout` | `layout-access`, `AppShell` | **Tight** — OK (single shell) |
| `AppShell` | `nav-config`, `department-sidebar-nav` | **Dual nav sources** | Medium |
| `dept/[deptKey]/page` | `dept-dashboard`, `DeptHomePage` | **Clean** | Low |
| `dashboard/page` | `super-admin-cockpit` | **SA frozen** | None |
| `modules/*/cockpit/*` | `lib/erp-core/governance/standard` | **Reference only** | Low (orphan UI) |
| API handlers | `api-route-guard`, domain asserts | **Self-guard** | Low post-Bloc1 |

## Orphan / dead dependency chains

| Artifact | Importers (app runtime) | Statut |
|----------|-------------------------|--------|
| `DeptSidebarNav` | **0** | Orphan |
| `dept-nav-configs.ts` | `dept-sidebar-nav` only | Orphan chain |
| `SuperAdminPrimarySidebar` | **0** (tests only) | Orphan |
| `SuperAdminMobileNav`, `MobileSidebar`, `PrimarySidebar` | **0** | Orphan cluster |
| `DepartmentDashboardPage` | **0** (tests only) | Orphan |
| `dept-dashboard-shell.tsx` | **0** | Orphan |
| `VenteCockpitClient` / `FinanceCockpitClient` | **0** in `app/` | Reference / dead route UI |

## Dual truth (navigation — non modifié)

| Source | Consommé par |
|--------|--------------|
| `lib/constants/nav-config.ts` | **ErpNavSidebar** (production SA) |
| `lib/navigation/super-admin-nav.ts` | Orphan SA components + lockdown tests |

**Pas de correction** — documenté pour cleanup Étape 2+.

## Module smell

- `modules/vente/` : 1 fichier — implémentation réelle dans `app/vente` + `components/vente`
- `modules/` platform packages (cloud, resilience, multitenant) : **parallèles** à `app/admin/*` sans lien runtime évident pour tous

## Verdict dependency

**PARTIAL** — chaîne authority Bloc 1 saine ; clusters legacy non branchés ; couplage admin/modules élevé.
