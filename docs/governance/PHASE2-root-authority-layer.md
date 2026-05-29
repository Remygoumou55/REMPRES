# PHASE 2 — Root Authority Layer (Runtime Unification)

**Date :** 2026-05-29  
**Statut :** Implémenté — migration SQL `094` à appliquer en production après `093`

---

## 1. Authorization Core Report

**Fichier pivot :** `lib/auth/authorization-core.ts`

| API | Rôle |
|-----|------|
| `toPlatformAuthorityProfile` / `fromAuthBrief` | Forme unifiée profil |
| `hasSystemAuthority` | Autorité plateforme ROOT/SUPER_ADMIN |
| `hasRootAuthority` | ROOT strict (colonne) |
| `resolveAuthorityScope` | Scope calculé (system, role, admin console) |
| `canAccessRoute` | Route guard unifié (+ utility paths) |
| `canExecuteAction` | Actions sensibles (foundation) |
| `resolveAuthenticatedLanding` | Redirect post-login unique |
| `resolveAuthenticatedSafeHome` | Access-denied safe home |

**Utility paths :** `lib/auth/route-utility-paths.ts` (partagé edge + app, sans cycle)

---

## 2. API Guard Stabilization Report

`lib/server/api-route-guard.ts` utilise `canAccessRoute(fromAuthBrief(brief))` pour finance/RH.

`lib/server/platform-governance-users.ts` — liste IDs gouvernance pour notifications/approvals.

`lib/server/approvals.ts` — `notifySuperAdmins` via `listActivePlatformGovernanceUserIds` (plus `role_key = super_admin` seul).

---

## 3. Redirect Governance Report

| Fichier | Changement |
|---------|------------|
| `lib/roleRedirects.ts` | `getPostLoginDestinationFromProfile`, `profileSliceToAuthority` |
| `app/login/page.tsx` | `system_authority` dans SELECT |
| `app/page.tsx` | idem |
| `app/login/LoginForm.tsx` | `getPostLoginDestinationFromProfile` |
| `app/auth/callback/CallbackClient.tsx` | idem |
| `app/auth/set-password/SetPasswordForm.tsx` | idem |

---

## 4. Route Governance Validation

Middleware `PROTECTED_PREFIXES` + matcher étendus :

- `/profil`, `/operations`, `/direction`, `/erp`, `/coming-soon`

`canAccessPathForProfile` + `edgeCanAccessPathForProfile` : utility paths synchronisés.

---

## 5. Navigation Authorization Report

`shell-visibility.ts` : `systemAuthority` dans `ShellVisibilityInput`, `hasSystemRootAuthority` pour mode SA.

`layout-access.ts` : passe `systemAuthority` au shell et `getPendingCount`.

`NotificationBell` / `useRealtimeNotifications` : prop `isPlatformGovernance` depuis `isSuperAdmin` layout.

**Zone gelée :** `ErpNavSidebar` non modifié.

---

## 6. Realtime Authorization Audit

| Composant | Fix |
|-----------|-----|
| `getPendingCount` | `isPlatformGovernanceActor` |
| `useRealtimeNotifications` | `isPlatformGovernance` prop |
| Session refresh | Inchangé — `router.refresh()` post mutation |

---

## 7. RLS Migration Strategy

**Fichier :** `supabase/sql/094_rls_governance_system_authority.sql`

- Remplace `role_key = super_admin` par `public.is_super_admin()` sur `approval_requests`
- Blocs conditionnels `governance_alerts`, `governance_audit_events`
- **Progressif** : domaines métier (vente, RH, …) restent sur policies existantes jusqu’à Phase 5

---

## 8. Legacy Cleanup Report

| Item | Statut Phase 2 |
|------|----------------|
| API guards sans SA | Corrigé |
| Redirects sans SA | Corrigé |
| `getSupervisionScope` sans SA | Corrigé |
| `notifySuperAdmins` role_key only | Corrigé |
| `canAccessDepartment` sans 4e arg | Signature étendue |
| Module `*-access.ts` legacy Sets | Phase 4 |
| RLS domain SQL (~40 fichiers) | Phase 5 / 094 partiel |

---

## 9. Performance Optimization Report

- Pas de requête auth supplémentaire : réutilisation `system_authority` déjà lue
- `listActivePlatformGovernanceUserIds` : une requête filtrée côté app (notifications)
- Shell permissions : inchangé (skip SA)

---

## 10. Authorization Matrix Foundation

`lib/auth/authorization-matrix-foundation.ts` — types `MatrixAuthorityScope`, contrat `AuthorizationMatrixEngine`.

---

## 11. Enterprise Test Matrix

`tests/unit/authorization-core.test.ts` — ROOT + `role_key=manager`, routes, `/profil`.

Exécution : `npx vitest run tests/unit/authorization-core.test.ts tests/unit/auth-matrix.test.ts`

---

## 12. Files Modified Report

| Zone | Fichiers |
|------|----------|
| Core | `authorization-core.ts`, `route-utility-paths.ts`, `authorization-matrix-foundation.ts` |
| Permissions | `permissions.ts`, `edge-route-guards.ts` |
| API | `api-route-guard.ts`, `platform-governance-users.ts`, `approvals.ts` |
| Redirects | `roleRedirects.ts`, login, page, callback, set-password |
| Runtime | `profile-row.ts`, `shell-visibility.ts`, `layout-access.ts`, `notifications.ts` |
| Realtime UI | `useRealtimeNotifications.ts`, `NotificationBell.tsx`, `app-shell.tsx` |
| Middleware | `middleware.ts` |
| SQL | `094_rls_governance_system_authority.sql` |
| Tests | `authorization-core.test.ts` |

---

## Validation production

1. Appliquer `093` puis `094` en Supabase SQL Editor
2. Vérifier compte ROOT : login → `/dashboard`, API finance deny, notifications gouvernance OK
3. Tester `/profil` et `/operations` (session + layout guard)
