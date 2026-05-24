# ADMIN GOVERNANCE REPORT — Bloc 2 Étape 2

**Classification :** KEEP / DELETE (fichiers supprimés)

## KEEP (13 pages + routes API activity-logs)

| Route | Fichier | Rôle |
|-------|---------|------|
| `/admin` | `page.tsx` | Redirect settings |
| `/admin/approvals` | `approvals/page.tsx` | Gouvernance live |
| `/admin/alerts` | `alerts/page.tsx` | Gouvernance live |
| `/admin/audit` | `audit/page.tsx` | Archives audit |
| `/admin/activity-logs` | `activity-logs/*` | Journaux + export |
| `/admin/archives` | `archives/page.tsx` | Archives admin |
| `/admin/exports` | `exports/page.tsx` | Exports |
| `/admin/suppressions` | `suppressions/page.tsx` | Suppressions |
| `/admin/platform-dashboard` | `platform-dashboard/page.tsx` | Console plateforme |
| `/admin/intelligence` | `intelligence/page.tsx` | Intelligence |
| `/admin/global-dashboard` | `global-dashboard/page.tsx` | Executive global |
| `/admin/users` | `users/page.tsx` | Utilisateurs |
| `/admin/departments/[key]` | `departments/[departmentKey]/page.tsx` | Supervision SA |

## DELETE (134 pages)

Toutes les routes hors registre `admin-route-registry.ts` — déjà **bloquées middleware** pour SA (redirect Paramètres). Suppression = allègement build, pas changement d’accès effectif.

## Module

`lib/navigation/admin-route-registry.ts` — `isAdminRouteKept()`
