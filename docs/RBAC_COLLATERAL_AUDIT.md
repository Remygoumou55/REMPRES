# RBAC Collateral Safety Audit

**Date:** 2026-05-22  
**Verdict:** **SAFE**

| Zone | Statut | Notes |
|------|--------|-------|
| Super Admin sidebar | **Intact** | Branche `super_admin_erp` → `ErpNavSidebar` non modifié |
| Routes Super Admin | **Intact** | Aucun changement middleware / admin |
| Dashboard SA | **Intact** | `dashboard/page.tsx` non touché |
| AppShell structure | **Intact** | Même layout, header, collapse — ajout props `shellRail` |
| Homepage métier | **Intact** | `DashboardClient` inchangé |
| UX Super Admin | **Intact** | Composant `ErpNavSidebar.tsx` non édité |
| Directeur général | **Intact** | Reste sur `ErpNavSidebar` (`director_erp`) |

## Changements limités

- `lib/navigation/sidebar-for-role.ts` (nouveau)
- `components/layout/app-shell.tsx` (résolution role-first)
- `app/(app)/layout.tsx` (pass-through `shellRail` + perms)
- `tests/unit/sidebar-for-role.test.ts` (nouveau)

## Non modifié

- `components/layout/app-shell/ErpNavSidebar.tsx`
- Tout le périmètre `/admin/*` Super Admin
- `lib/constants/nav-config.ts` (structure NAV_CONFIG)
