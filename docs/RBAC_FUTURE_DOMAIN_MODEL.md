# RBAC Future Domain Model

**Date:** 2026-05-22

## Ajouter un nouveau département

1. **`lib/departments/department-config.ts`** — `DEPARTMENT_NAVIGATION`, clés, préfixes routes.
2. **`lib/navigation/erp-ux-architecture.ts`** — `OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[DEPT].navGroups`.
3. **`lib/navigation/shell-visibility.ts`** — flag rail (`commerce`, `finance`, …) si nouveau module.
4. **`lib/middleware/edge-route-guards.ts`** — préfixes cross-dept (déjà centralisés via `getDepartmentRoutePrefixes`).
5. **Optionnel** — entrée `LEGACY_ROLE_TO_DEPARTMENT` si rôle historique DB.

**Aucune modification AppShell** : `getSidebarForRole` résout automatiquement via `department_key`.

## Pattern obligatoire

```
Nouveau dept → DEPARTMENT_NAVIGATION + OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE
            → shellRail rule
            → middleware prefix
            → sidebar auto via DepartmentBusinessSidebar
```

## Interdit

- Copier-coller une sidebar par département dans `AppShell`.
- Étendre `NAV_CONFIG` pour les rôles métier (réservé SA / DG).
