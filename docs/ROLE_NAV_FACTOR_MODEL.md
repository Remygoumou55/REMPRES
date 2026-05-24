# Role Nav Factor Model

**Date:** 2026-05-22  
**Source unique :** `lib/navigation/sidebar-for-role.ts`

## Architecture cible

```
profile (roleKey + departmentKey + isSuperAdmin)
        ↓
getSidebarForRole()
        ↓
┌───────────────────┬────────────────────────────┐
│ super_admin_erp   │ ErpNavSidebar + NAV_CONFIG │
│ director_erp      │ ErpNavSidebar (DG)         │
│ department_business│ DepartmentBusinessSidebar │
│ department_legacy │ DeptSidebarNav (filet)     │
└───────────────────┴────────────────────────────┘
        ↓
filterDepartmentSidebarGroups(shellRail, permissions)
```

## Carte de factorisation

| Entrée | Mode | Composant |
|--------|------|-----------|
| `isSuperAdmin === true` | `super_admin_erp` | `ErpNavSidebar` |
| `roleKey === directeur_general` | `director_erp` | `ErpNavSidebar` |
| `department_key` résolu (M1) | `department_business` | `DepartmentBusinessSidebar` |
| Alias legacy (`responsable_vente`, …) | `department_business` | `LEGACY_ROLE_TO_DEPARTMENT` |
| Legacy sans dept (rare) | `department_legacy` | `DeptSidebarNav` |

## Duplications évitées

- **Pas** de `if (role === 'vente')` dans `AppShell`.
- **Pas** de nouvelle copie de liens : réutilisation de `OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE` + `shellRail`.
- `dept-nav-configs.ts` conservé comme filet legacy uniquement.

## Alignement shell

`layout-access.ts` → `shellRail` + permissions lecture → passés à `AppShell` pour filtrage rail identique au dashboard M2.
