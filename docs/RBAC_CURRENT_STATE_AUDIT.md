# RBAC Current State Audit

**Date:** 2026-05-22  
**Verdict:** Root cause identified — fixed in `sidebar-for-role` + `AppShell`

## Symptom

Un utilisateur **Responsable Vente** (ou `manager` + département `VENTE`) voyait la sidebar complète type **Super Admin** (`ErpNavSidebar` + `NAV_CONFIG`).

## Sources analysées

| Couche | Fichier | Rôle |
|--------|---------|------|
| Rendu sidebar | `components/layout/app-shell.tsx` | Choix `DeptSidebarNav` vs `ErpNavSidebar` |
| Config legacy | `lib/constants/dept-nav-configs.ts` | `DEPT_NAV_CONFIGS`, `isDeptRole()` |
| Config ERP global | `lib/constants/nav-config.ts` | `filterNavConfig(userRole)` |
| Rail M2 | `lib/navigation/shell-visibility.ts` | Visibilité modules (non branchée sur AppShell avant fix) |
| Rail M3 | `lib/navigation/department-sidebar-nav.ts` | `buildDepartmentSidebarGroups` (existant, non utilisé par AppShell) |
| Middleware | `lib/middleware/edge-route-guards.ts` | Isolation URL (déjà en place) |
| Layout | `app/(app)/layout.tsx` + `lib/server/layout-access.ts` | `roleKey`, `departmentKey`, `shellRail` |

## Cause racine

1. **`isDeptRole(userRole)`** ne retourne `true` que pour des clés **legacy** (`responsable_vente`, `comptable`, …). Les profils DB canoniques **`manager` / `agent` + `department_key`** ne matchent pas → fallback **`ErpNavSidebar`**.

2. **`isSuperAdmin` n’était pas utilisé** pour choisir la sidebar : seul `isDeptRole` déclenchait la nav département.

3. **`filterNavConfig("manager")`** sur `NAV_CONFIG` laisse voir :
   - Accueil (`roles: "all"`)
   - Départements (parent `all` + enfants incluant `manager`)
   - Actions, Archives (selon entrées)
   → **Apparence sidebar Super Admin** pour un non-SA.

4. **`DepartmentBusinessSidebar`** (architecture M3 officielle, filtrée par `shellRail`) existait mais **n’était pas câblée** dans `AppShell` — uniquement documentée / testée.

## Flux avant correction

```
roleKey = manager, department = VENTE
  → isDeptRole("manager") = false
  → ErpNavSidebar + filterNavConfig("manager")
  → Sidebar quasi complète
```

## Flux après correction

```
getSidebarForRole({ isSuperAdmin, roleKey, departmentKey })
  → super_admin → ErpNavSidebar (inchangé)
  → directeur_general → ErpNavSidebar (inchangé)
  → manager + VENTE → DepartmentBusinessSidebar + shellRail
  → responsable_vente → DepartmentBusinessSidebar (alias dept VENTE)
```

## Super Admin

Branche **`usesErpGlobalSidebar('super_admin_erp')`** → même composant `ErpNavSidebar`, mêmes props — **aucune modification du code Super Admin**.
