# Audit performance & push — M3.5 / M3.75

**Date :** 2026-05-22

## Validation

| Contrôle | Résultat |
|----------|----------|
| `tsc --noEmit` | OK |
| `npm test` | 77/77 |
| `npm run build` | OK (258 pages) |

## Corrections appliquées

1. **layout-access** — suppression appel DB redondant `isSuperAdmin()` ; dérivation depuis `authBrief.roleKey`.
2. **Sidebar métier** — `useMemo` + `filterDepartmentSidebarGroups` partagé (desktop/mobile).
3. **Auth callback** — redirection post-OAuth via `resolvePostLoginRoute` (plus `/dashboard` figé pour métiers).
4. **CollapsibleNavGroup** — clés localStorage séparées `rempres_dept_nav` vs super admin.

## Build

- First Load JS shared : **87.8 kB**
- `/dashboard` (super admin cockpit) : **293 kB** First Load (recharts)
