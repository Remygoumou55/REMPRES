# RBAC Performance Report

**Date:** 2026-05-22

## Optimisations appliquées

| Technique | Emplacement | Effet |
|-----------|-------------|-------|
| `useMemo` sur `getSidebarForRole` | `app-shell.tsx` | Résolution mode sidebar stable entre rerenders |
| `useCallback` toggle expand | `app-shell.tsx` | Référence stable pour `DepartmentBusinessSidebar` |
| `memo` existant | `DepartmentBusinessSidebar`, `DeptSidebarNav`, `ErpNavSidebar` | Inchangé |
| `useMemo` groupes nav | `DepartmentBusinessSidebar` | Inchangé — filtre rail + perms |
| Dynamic import | `DepartmentBusinessSidebar` | Code-split, chargement différé |

## Non fait (volontairement)

- Pas de rewrite AppShell.
- Pas de refonte `NAV_CONFIG`.
- Pas de cache serveur supplémentaire (résolution client légère).

## Résolution rôle

Coût O(1) : lookups sur maps `LEGACY_ROLE_TO_DEPARTMENT` + `FULL_SIDEBAR_ROLES`.
