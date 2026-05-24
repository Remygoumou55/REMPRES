# RBAC HARD LOCK — Bloc 1 Étape 5 (Certification)

**Date :** 22 mai 2026  
**Verdict global :** `CERTIFIED` (avec réserves documentées)

---

## 1. Contexte

Validation finale du bloc **SECURITY + ISOLATION LOCK** après :

| Étape | Livrable | Verdict |
|-------|----------|---------|
| 1 | RBAC Master Audit | PARTIAL |
| 2 | Role Source Lock | ROLE_SOURCE_LOCKED |
| 3 | Sidebar Isolation | SIDEBAR_ISOLATED |
| 4 | Route Isolation | ROUTE_ISOLATED |

Mission : **prouver** que le verrouillage tient — pas supposer un PASS cosmétique.

---

## 2. Rappel étapes 1–4

Autorité unifiée :

- `lib/auth/profile-authority.ts` — rôle + département effectif
- `lib/navigation/sidebar-authority.ts` — rendu sidebar
- `lib/navigation/route-authority.ts` — accès URL
- `lib/middleware/edge-route-guards.ts` — enforcement Edge

Super Admin : **aucune modification** aux étapes 5 ; tests SA de non-régression passent (`super-admin-lockdown`, `settings-legacy-route-lock`).

---

## 3. Certification matrix (Phase 1)

**Tests :** `tests/unit/rbac-hard-lock-cert.test.ts` (26 cas)

| ROLE | SIDEBAR | ROUTES | ADMIN | Résultat |
|------|---------|--------|-------|----------|
| super_admin | ErpNavSidebar (gelé) | Gouvernance OK, opérationnel DENY | Oui | PASS |
| manager VENTE | Dept VENTE | /vente OK, /finance DENY | Non | PASS |
| manager FINANCE | Dept FINANCE | /finance OK, /vente DENY | Non | PASS |
| manager RH | Dept RH | /rh OK, /vente DENY | Non | PASS |
| responsable_vente | Dept VENTE (alias) | /dept/vente OK, /dept/finance DENY | Non | PASS |
| directeur_general | Dept ADMIN | /actions OK, /vente DENY | Oui | PASS |
| accountant | Dept FINANCE | /finance OK | Non | PASS |

**E2E logique (Phase 4) :** edge ≡ app sur tous les chemins testés (`route-isolation-matrix` 20 cas).

---

## 4. API guards (Phase 2)

**Verdict API :** `LOCKED` (renforcé Étape 5)

| Zone | Protection | Statut |
|------|------------|--------|
| `/api/dept/[deptKey]/kpis` | `assertApiDeptKpiAccess` — authority + module read | **Corrigé** (suppression bypass `legacyDG` / `isAdminRole` global) |
| `/api/rh/*` | `assertCanRead*` domain + session | OK |
| `/api/finance/*` | `getModulePermissions` + route path | OK |
| `/api/erp/observability/*` | `assertErpObservabilityReadAccess` | OK |
| `/api/internal/*` | Secret / operator guard | OK |
| `/api/admin/users` | Admin session | OK |

**Module :** `lib/server/api-route-guard.ts`  
**Tests :** `tests/unit/api-route-guard.test.ts` (7)

**Note :** Les routes `/api/*` restent **hors matcher middleware** — chaque handler doit garder un garde-fou explicite (documenté, pas un bypass silencieux).

---

## 5. Profile integrity (Phase 3)

**Verdict :** `DIAGNOSTIC_READY` (pas de migration auto)

- Script : `supabase/sql/063_profile_authority_diagnostics.sql`
- Flags drift exposés : `buildProfileAuthoritySlice` → `authorityDriftFlags` sur `getCachedProfileRow` / `ProfileAuthBrief`
- Profils canoniques (manager + `department_key`) : **aucun drift flag** en tests

**Action opérationnelle :** exécuter le SQL en prod/staging et corriger manuellement les profils P0 (`role_key` incorrect, `department_key` NULL).

---

## 6. E2E security (Phase 4)

| Scénario | Attendu | Mesuré |
|----------|---------|--------|
| VENTE → `/finance` | DENY | DENY |
| RH → `/vente` | DENY | DENY |
| FINANCE → `/dept/vente` | DENY | DENY |
| DG → `/vente/clients` | DENY | DENY |
| DG → `/actions` | ALLOW | ALLOW |
| SA → `/vente/nouvelle-vente` | DENY | DENY |
| SA → `/dashboard` | ALLOW | ALLOW |
| Legacy `/dept/rh` (responsable_vente) | DENY | DENY |
| URL `/access-denied` | Accessible | OK (matcher) |

**Verdict E2E :** `LOCKED`

---

## 7. Authority drift (Phase 5)

**Tests :** `tests/unit/authority-drift-audit.test.ts` (7)

| Vérification | Résultat |
|--------------|----------|
| `middleware` sans `isDeptRouteAllowed` / `rempres_role` | PASS |
| `dept-cockpit-route` sans import `DEPT_ALLOWED_ROUTES` | PASS |
| Pas de `isDeptRouteAllowed` actif dans lib/ | PASS |
| Modules canoniques présents | PASS |

**Cookie `rempres_role` :** UX login uniquement — **non** utilisé pour deny middleware.

**Verdict drift :** `NO_ACTIVE_PARALLEL_TRUTH`

---

## 8. Performance (Phase 6)

| Optimisation | Impact |
|--------------|--------|
| 1 lecture profil / requête (headers + `getCachedProfileRow`) | Maintenu |
| Suppression double garde middleware (`isDeptRouteAllowed`) | −1 branche |
| `buildRouteAccessSlice` / `buildProfileAuthoritySlice` O(1) | Pur, sans I/O |
| API dept KPI : 1 guard authority au lieu de 3 bypass parallèles | Moins de confusion, coût stable |

**Verdict perf :** `CERTIFIED_NO_REGRESSION` (build + 97 tests sécurité PASS)

---

## 9. Dette restante (honnête)

| ID | Item | Sévérité | Bloque CERTIFIED ? |
|----|------|----------|-------------------|
| D1 | `/api/*` hors middleware — dépend des handlers | Info | Non (guards présents) |
| D2 | Profils DB incorrects en production | P0 data | Non (hors code) |
| D3 | `m3-75-final-lock.test.ts` — nom composant SA obsolète | Test drift | Non (pré-existant, hors périmètre SA gelé) |
| D4 | Pages `/admin/*` legacy (~140) — bloquées SA, pas supprimées | Info | Non |
| D5 | LOGISTIQUE / MARKETING / FORMATION — couverture tests partielle | Faible | Non |

---

## 10. Security validation (Phase 7)

| Check | Résultat |
|-------|----------|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Suite sécurité ciblée (97 tests) | PASS |
| `super-admin-lockdown` | PASS |
| `settings-legacy-route-lock` | PASS |

---

## 11. Verdict final

### `CERTIFIED`

Le système RBAC non-SA est **certifié** pour :

- Autorité unique role/department
- Sidebar isolée par département
- Routes isolées (middleware + app alignés)
- Legacy `/dept/*` verrouillé
- API dept KPI corrigée (fuite DG cross-dept)
- Super Admin inchangé fonctionnellement

### Pourquoi pas `FAILED`

Aucune fuite active détectée dans les matrices automatisées. Les réserves D1–D5 sont **documentées** et ne constituent pas des bypass code non gouvernés.

### Pourquoi pas `PARTIAL` seul

Les items PARTIAL de l’Étape 1 (shellRail, legacy routes) sont **fermés** aux Étapes 2–4. L’Étape 5 confirme par tests croisés.

---

## 12. PUSH

Voir commit `rbac-hard-lock-stage5` — `PUSH_REPORT` en tête de commit.
