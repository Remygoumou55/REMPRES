# ROUTE ISOLATION — Bloc 1 Étape 4

**Date :** 22 mai 2026  
**Version :** `route-isolation-v1`  
**Verdict :** `ROUTE_ISOLATED`

---

## 1. Contexte

Post-P9, après :

- **Étape 1** — RBAC Master Audit (PARTIAL)
- **Étape 2** — Role Source Lock (`ROLE_SOURCE_LOCKED`)
- **Étape 3** — Sidebar Isolation (`SIDEBAR_ISOLATED`)

Mission : verrouiller l’accès URL par rôle à partir de `profile-authority`, sans rebuild middleware ni modification Super Admin.

---

## 2. Rappel étapes 1–3

| Étape | Verrou |
|-------|--------|
| 2 | `resolveAuthorityDepartmentKey` — vérité département |
| 3 | `sidebar-authority` — rendu isolé non-SA |
| 4 | `route-authority` — enforcement URL aligné |

---

## 3. Authority path (Phase 1)

```mermaid
flowchart TD
  P[profiles DB] --> A[profile-authority]
  A --> R[route-authority]
  R --> E[edge-route-guards.edgeCanAccessPathForProfile]
  R --> C[permissions.canAccessPathForProfile]
  E --> M[middleware.ts]
  M -->|allow| Page
  M -->|deny| AD[/access-denied]
```

**Module canonique :** `lib/navigation/route-authority.ts`  
**Lock /dept :** `dept-cockpit-route.canProfileAccessDeptPath` (strict, sans `DEPT_ALLOWED_ROUTES`)

---

## 4. Route isolation (Phase 2)

| Profil | Autorisé | Refusé |
|--------|----------|--------|
| manager + VENTE | `/vente/*`, `/dept/vente` | `/finance`, `/rh`, `/dept/finance` |
| manager + FINANCE | `/finance/*`, `/dept/finance` | `/vente/*` |
| manager + RH | `/rh/*`, `/dept/rh` | `/vente/*`, `/finance` |
| responsable_vente (legacy) | `/dept/vente`, `/vente/*` | `/dept/finance`, `/dept/rh` |
| directeur_general | Console admin (`/actions`, `/admin/platform-dashboard`, …) | Opérationnel vente/finance |
| super_admin | Gouvernance + lecture vente archives | Opérationnel métier (inchangé) |

Préfixes opérationnels : `getDepartmentRoutePrefixes(resolveAuthorityDepartmentKey(...))`.

---

## 5. Middleware governance (Phase 4)

| Changement | Détail |
|------------|--------|
| Source unique | `edgeCanAccessPathForProfile` uniquement (suppression `isDeptRouteAllowed` parallèle) |
| Cookie | `rempres_role` retiré du deny path — profil DB seul |
| DG bypass | Suppression exception `directeur_general` dans le second garde-fou |
| Deny URL | `/access-denied` sans query parasite |
| Matcher | `+ /access-denied`, `+ /error-profile` |

**Verdict middleware :** `LOCKED` pour le périmètre protégé listé.

**Hors matcher (inchangé) :** `/api/*` — garde-fous propres aux handlers.

---

## 6. Legacy lock (Phase 3)

| Élément | Action |
|---------|--------|
| `DEPT_ALLOWED_ROUTES` dans `canProfileAccessDeptPath` | **Supprimé** — fuite `/dept/*` cross-slug corrigée |
| `isDeptRouteAllowed` (middleware) | **Retiré** — `@deprecated` dans `role-routes.ts` |
| `canProfileAccessDeptPath` | Uniquement cockpit = département effectif |

---

## 7. Access-denied policy (Phase 5)

- Refus middleware → `/access-denied` (search vidé)
- Compte bloqué → `?reason=blocked` (inchangé)
- Page deny inchangée (pas de refonte UX)
- Pas de redirect loop : deny hors matcher auth obligatoire

---

## 8. Performance (Phase 6)

- **−1 garde-fou** middleware (`isDeptRouteAllowed` + cookie parsing)
- Préfixes département : une résolution `resolveAuthorityDepartmentKey` par check
- Profil : headers middleware réutilisés en RSC (`getCachedProfileRow`)

---

## 9. Dette restante

| Item | Statut |
|------|--------|
| `/api/*` hors matcher middleware | Garde API par route (existant) |
| Profils DB `role_key` incorrect | Correction données (SQL 063) |
| Pages admin legacy (~140) | Bloquées SA + redirect settings (inchangé) |

---

## 10. Validation matrix (Phase 7)

Tests : `route-isolation-matrix.test.ts` (20), `auth-matrix.test.ts` (12), `settings-legacy-route-lock.test.ts`.

| ROLE | ROUTE | EXPECTED | RESULT |
|------|-------|----------|--------|
| manager VENTE | `/finance` | DENY | PASS |
| manager VENTE | `/dept/finance` | DENY | PASS |
| responsable_vente | `/dept/rh` | DENY | PASS |
| directeur_general | `/vente/clients` | DENY | PASS |
| directeur_general | `/actions` | ALLOW | PASS |
| super_admin | `/vente/nouvelle-vente` | DENY | PASS |

**Build/lint :** PASS.

---

## 11. Verdict

**`ROUTE_ISOLATED`**

- Routes consomment `profile-authority` via `route-authority`
- Legacy `/dept/*` verrouillé (0 fuite cross-slug)
- Middleware = enforcement unique non-SA
- Super Admin inchangé
- Tests + build OK
