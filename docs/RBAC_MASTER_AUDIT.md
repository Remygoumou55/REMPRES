# RBAC MASTER AUDIT — Bloc 1 Security + Isolation Lock (Étape 1)

**Mission :** audit fullstack uniquement — **aucune correction appliquée**  
**Date :** 24 mai 2026  
**État projet :** POST-P9  
**Super Admin :** zone gelée — lecture seule durant cet audit  
**Verdict final :** **PARTIAL** (voir §10)

---

## Table des matières

1. [Architecture RBAC actuelle](#1-architecture-rbac-actuelle)  
2. [ROLE_SOURCE_REPORT — Phase 1](#2-role_source_report--phase-1)  
3. [SIDEBAR_PIPELINE_REPORT — Phase 2](#3-sidebar_pipeline_report--phase-2)  
4. [ROUTE_SECURITY_REPORT — Phase 3](#4-route_security_report--phase-3)  
5. [DASHBOARD_AUDIT_REPORT — Phase 4](#5-dashboard_audit_report--phase-4)  
6. [SUPER_ADMIN_SAFETY_REPORT — Phase 5](#6-super_admin_safety_report--phase-5)  
7. [RBAC_DEBT_REPORT — Phase 6](#7-rbac_debt_report--phase-6)  
8. [Leak exact — analyse du bug observé](#8-leak-exact--analyse-du-bug-observé)  
9. [Risk matrix](#9-risk-matrix)  
10. [MASTER VERDICT + recommandations](#10-master-verdict--recommandations)  
11. [RBAC_PERFORMANCE_OBSERVATION — Phase 8](#11-rbac_performance_observation--phase-8)  
12. [AUDIT_VALIDATION_REPORT — Phase 9](#12-audit_validation_report--phase-9)

---

## 1. Architecture RBAC actuelle

### 1.1 Modèle en couches (réel, pas idéal)

```
┌─────────────────────────────────────────────────────────────────┐
│  COUCHE AUTORITATIVE                                            │
│  public.profiles (role_key, department_key, is_active)          │
│  public.permissions (role_key × module_key × can_*)               │
│  Supabase RLS (SQL 022–027)                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  COUCHE EDGE (middleware.ts)                                      │
│  auth.getUser() → profiles SELECT → x-rempres-* headers           │
│  edgeHasAdminConsoleAccess / edgeCanAccessPathForProfile           │
│  isDeptRouteAllowed (legacy, cookie fallback)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  COUCHE SERVEUR RSC                                               │
│  getCachedProfileRow → getLayoutAccess → getShellLayoutPermissions│
│  hasAdminConsoleAccess / canAccessPathForProfile (miroir edge)    │
│  isSuperAdmin(userId) → exact role_key === super_admin            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  COUCHE UI (client)                                               │
│  AppShell props: userRole, isSuperAdmin, shellRail                │
│  getSidebarForRole → ErpNavSidebar | DepartmentBusinessSidebar      │
│  filterNavConfig(userRole) — filtre affichage uniquement            │
│  Cookie rempres_role — hint UX, non autoritaire                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Fichiers pivot

| Domaine | Fichiers |
|---------|----------|
| Rôles canoniques | `lib/auth/roles.ts` |
| Permissions métier | `lib/auth/permissions.ts` |
| Edge guards | `lib/middleware/edge-route-guards.ts` |
| Middleware | `middleware.ts` |
| Profil requête | `lib/middleware/profile-headers.ts`, `lib/server/profile-row.ts` |
| Layout shell | `lib/server/layout-access.ts`, `app/(app)/layout.tsx` |
| Sidebar | `lib/navigation/sidebar-for-role.ts`, `components/layout/app-shell.tsx` |
| Routes legacy | `lib/constants/role-routes.ts`, `lib/constants/dept-nav-configs.ts` |
| Routes dept | `lib/navigation/dept-cockpit-route.ts`, `lib/departments/department-config.ts` |
| Post-login | `lib/navigation/home-route.ts`, `app/(app)/dashboard/page.tsx` |
| Nav globale SA | `lib/constants/nav-config.ts`, `ErpNavSidebar.tsx` |

### 1.3 Verdict architecture

**Verdict couche :** modèle **multi-sources coordonnées**, pas une single source of truth unique.  
**Autorité sécurité :** `profiles.role_key` + RLS.  
**Autorité UX navigation :** props serveur + `getSidebarForRole` + `shellRail`.

---

## 2. ROLE_SOURCE_REPORT — Phase 1

### 2.1 Qui décide du rôle ?

| Question | Réponse |
|----------|---------|
| Le rôle vient-il de `profile.role_key` ? | **Oui** — décisions sécurité edge + serveur |
| D’un cookie ? | **`rempres_role`** — fallback **legacy uniquement** dans `isDeptRouteAllowed` si `role_key` null ; **ne confère pas SA** |
| D’un fallback client ? | **Non** pour l’auth ; props RSC depuis serveur |
| Plusieurs sources ? | **Oui** — DB + headers middleware + cookie hint + alias `effectiveAuthRoleKey` |

### 2.2 Pipeline auth → role → consumer

```
Login (LoginForm.tsx)
  → supabase.auth.signInWithPassword
  → profiles SELECT (role_key, department_key)
  → cookie rempres_role = role_key (UX)
  → redirect resolvePostLoginRoute

Chaque requête protégée (middleware.ts)
  → auth.getUser()
  → profiles SELECT (role_key, department_key, is_active)
  → applyProfileHeaders → x-rempres-role, x-rempres-dept, …
  → edgeCanAccessPathForProfile(roleKey DB, deptKey DB)
  → isDeptRouteAllowed(roleKey ?? cookie, pathname)  [legacy only]

RSC (getLayoutAccess)
  → getCachedProfileRow: headers middleware OU profiles SELECT
  → isSuperAdmin = effectiveAuthRoleKey === super_admin
  → getShellLayoutPermissions (sauf SA exact → skip query)
  → resolveShellRailVisibility(profile.department_key ONLY)
  → props → AppShell
```

### 2.3 Alias et canonicalisation (`lib/auth/roles.ts`)

| Entrée DB | `effectiveAuthRoleKey` | Effet |
|-----------|------------------------|-------|
| `super_admin` | `super_admin` | Gouvernance globale |
| `directeur_general` | `manager` (alias) | **Mais** sidebar reste `director_erp` via raw role string |
| `responsable_vente` | `""` ou non mappé générique | Legacy — sidebar via `LEGACY_ROLE_TO_DEPARTMENT` |
| `manager` + `VENTE` | `manager` | Profil canonique M2 |

### 2.4 Fallbacks détectés

| # | Fallback | Risque |
|---|----------|--------|
| F1 | `rempres_role` cookie si `role_key` null | Faible — n’élève pas à SA |
| F2 | `resolvePostLoginRoute` → `/dashboard` si dept inconnu | UX — middleware bloque ensuite |
| F3 | `resolveSidebarDepartmentKey` legacy map si dept null | **Moyen** — sidebar mode OK, **shellRail non** |
| F4 | Headers `x-rempres-*` cache profil | Faible — set par middleware même requête |

### 2.5 Fallback Super Admin ?

**Non** via cookie ou client seul.  
**Oui** si `profiles.role_key === 'super_admin'` en DB (comportement attendu).  
**Confusion possible :** `directeur_general` reçoit **ErpNavSidebar globale** (visuel proche SA) — **intentionnel historique**, pas SA complet.

**Verdict Phase 1 :** **PARTIAL** — source autoritaire claire (DB), mais **truth multiple** pour UX (alias, cookie, legacy).

---

## 3. SIDEBAR_PIPELINE_REPORT — Phase 2

### 3.1 Pipeline visuel

```
getLayoutAccess()
  → roleKey, departmentKey, isSuperAdmin, shellRail, canRead*
       ↓
AppShell (client)
  → getSidebarForRole({ isSuperAdmin, roleKey, departmentKey })
       ↓
resolveSidebarRenderMode()
  ├─ isSuperAdmin OR role=super_admin     → super_admin_erp
  ├─ role in FULL_SIDEBAR_ROLES           → director_erp  (directeur_general)
  ├─ resolveSidebarDepartmentKey()        → department_business  ← manager, responsable_vente, agent, accountant
  ├─ isDeptRole + dept-nav-config         → department_legacy (quasi jamais atteint)
  └─ fallback                             → department_business
       ↓
renderSidebar()
  ├─ usesErpGlobalSidebar(mode)           → ErpNavSidebar + filterNavConfig(userRole)
  └─ department_business                  → DepartmentBusinessSidebar
        → buildDepartmentSidebarGroups(dept)
        → filterDepartmentSidebarGroups(shellRail, canRead*)
```

### 3.2 Sources de navigation (duplication)

| Composant | Source nav | Filtre |
|-----------|------------|--------|
| **ErpNavSidebar** | `NAV_CONFIG` (`nav-config.ts`) | `filterNavConfig(userRole)` |
| **DepartmentBusinessSidebar** | `OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE` + `CRM_NAV` + `LOGISTICS_NAV` | `shellRail` + permissions |
| **DeptSidebarNav** (legacy) | `DEPT_NAV_CONFIGS` | Aucun — **quasi mort** |

### 3.3 Matrice rôle → sidebar

| Profil | Mode | Composant | Items typiques |
|--------|------|-----------|----------------|
| `super_admin` | `super_admin_erp` | ErpNavSidebar | Accueil, **7 Départements**, Actions, Archives, Admin |
| `directeur_general` | `director_erp` | ErpNavSidebar | **Même chrome global** — filtré par `filterNavConfig` |
| `manager` + VENTE | `department_business` | DepartmentBusinessSidebar | Accueil `/dept/vente`, Commerce, CRM |
| `responsable_vente` | `department_business` | DepartmentBusinessSidebar | **Devrait** = manager vente |
| `agent` + VENTE | `department_business` | DepartmentBusinessSidebar | Idem, permissions réduites |
| `accountant` + FINANCE | `department_business` | DepartmentBusinessSidebar | Accueil `/dept/finance`, Finance |

### 3.4 Pourquoi « Responsable Vente voit sidebar SA » ?

| Cause | Probabilité | Mécanisme |
|-------|-------------|-----------|
| **A. Mauvais `role_key` en DB** | **Élevée** | `super_admin` ou `directeur_general` → `ErpNavSidebar` global |
| **B. Similarité visuelle M3** | **Élevée** | `DepartmentBusinessSidebar` = même rail collapsible que SA (by design) |
| **C. Rail vide / minimal** | **Moyenne** | `department_key` null + legacy alias → Accueil seul → utilisateur pense « bug » |
| **D. Code path SA pour responsable_vente** | **Faible** | `FULL_SIDEBAR_ROLES` n’inclut **pas** `responsable_vente` |

### 3.5 Divergence critique : sidebar dept vs shellRail

| Mécanisme | Utilise legacy role alias ? | Utilise `department_key` ? |
|-----------|----------------------------|----------------------------|
| `resolveSidebarDepartmentKey` | **Oui** | Oui (prioritaire) |
| `resolveShellRailVisibility` | **Non** | **Oui uniquement** |

**Effet :** `responsable_vente` sans `department_key` → mode `department_business` + dept VENTE résolu **mais** `shellRail.commerce/crm = false` → **groups Commerce/CRM masqués**.

**Verdict Phase 2 :** **PARTIAL** — pipeline unique (`getSidebarForRole`), mais **double source nav** (nav-config vs erp-ux-architecture vs dept-nav-configs mort) et **bug cohérence shellRail**.

---

## 4. ROUTE_SECURITY_REPORT — Phase 3

### 4.1 Middleware actif ?

**Oui** — matcher couvre : `/dashboard`, `/dept`, `/settings`, `/vente`, `/admin`, `/rh`, `/finance`, `/formation`, `/consultation`, `/marketing`, `/logistique`, `/actions`, `/archives`, `/config`, `/parametres`.

**Non couvert (pas de RBAC edge) :** `/api/*`, `/direction`, `/erp/*`, `/coming-soon`, routes publiques auth.

### 4.2 Ordre des gardes (middleware.ts)

1. Nav rewrite/alias  
2. Auth session  
3. Profile load + headers  
4. `edgeResolveSettingsGovernanceRedirect`  
5. `isAdminConsoleRestrictedPath` + `edgeHasAdminConsoleAccess`  
6. `edgeCanAccessPathForProfile`  
7. `isDeptRouteAllowed` (legacy — **no-op pour `manager`/`agent`**)

### 4.3 Coverage map — MANAGER + VENTE

| Route | Middleware | Page guard | Accès effectif |
|-------|------------|------------|----------------|
| `/vente/*` | ✅ Allow | Module perms | ✅ |
| `/dept/vente` | ✅ Allow | — | ✅ |
| `/dept/finance` | ❌ Deny | — | ❌ |
| `/finance/*` | ❌ Deny | Module perms | ❌ |
| `/admin/*` (console) | ❌ Deny | — | ❌ |
| `/admin/activity-logs` | ❌ Deny | Page | ❌ |
| `/dashboard` | ✅ **Allow universel** | Redirect | 🟡 Preload KPI puis redirect |
| `/settings` | ✅ **Allow universel** | Per-page admin | 🟡 Hub prefs OK |
| `/actions`, `/archives` | ❌ Deny | Admin | ❌ |
| `/rh`, `/logistique` | ❌ Deny | Module | ❌ |

### 4.4 Bypass potentiels

| # | Bypass | Sévérité |
|---|--------|----------|
| B1 | `/api/*` hors middleware — permissions par `role_key` seul (sans dept) | **P1** |
| B2 | Legacy `responsable_vente` + `/dept/*` any slug via `canProfileAccessDeptPath` legacy branch | **P1** |
| B3 | `/dashboard` allowlist universelle — preload KPI SA avant redirect | **P2** |
| B4 | `/direction`, `/erp/observability` — login layout only | **P2** (page guards) |
| B5 | `isDeptRouteAllowed` no-op pour rôles génériques | **P2** (compensé par edge guards) |

### 4.5 Duplication edge vs serveur

`edge-route-guards.ts` et `lib/auth/permissions.ts` (`canAccessPathForProfile`) — **logique dupliquée**. Risque de **drift** si correction future sur un seul fichier.

**Verdict Phase 3 :** **PARTIAL** — isolation cross-dept **solide pour manager+VENTE** sur HTML ; failles legacy + API + allowlist dashboard.

---

## 5. DASHBOARD_AUDIT_REPORT — Phase 4

### 5.1 Pipeline `/dashboard`

```typescript
// app/(app)/dashboard/page.tsx (lecture audit — non modifié)

1. getLayoutAccess()
2. Si roleKey in DEPT_REDIRECT (legacy responsable_*) → redirect /dept/{slug}
3. Promise.all([ getDashboardKpis(), loadAccueilDashboard() ])  ← TOUJOURS exécuté si pas legacy redirect
4. Si !access.isSuperAdmin → redirect(resolvePostLoginRoute(...))
5. Sinon → SuperAdminCockpitClient
```

### 5.2 Comportement par rôle

| Rôle | Chemin |
|------|--------|
| Legacy `responsable_vente` | Redirect immédiat `/dept/vente` — **pas de KPI SA** |
| `manager` + VENTE | **Charge KPI globaux** → redirect `/dept/vente` |
| `super_admin` | Affiche cockpit SA |
| `manager` sans dept | Charge KPI → redirect `resolvePostLoginRoute` → **`/dashboard` fallback SA route** |

### 5.3 `resolvePostLoginRoute` (home-route.ts)

| Condition | Destination |
|-----------|-------------|
| `super_admin` | `/dashboard` |
| `accountant` | `/dept/finance` |
| `auditor` | `/admin/activity-logs` |
| `manager` + dept | `nav.dashboardRoute` → `/dept/{slug}` |
| `manager` **sans** dept | **`/dashboard`** (fallback SA cockpit route) |
| `agent` sans dept | **`/dashboard`** fallback |

**Risque :** manager/agent mal configurés bouclent vers zone SA **middleware allow** + **preload KPI**.

**Verdict Phase 4 :** **PARTIAL** — redirects legacy OK ; **preload KPI non-SA** et **fallback route SA** pour profils incomplets.

---

## 6. SUPER_ADMIN_SAFETY_REPORT — Phase 5

### 6.1 Zone gelée — fichiers interdits à modifier

- `app/(app)/dashboard/page.tsx`  
- `DashboardClient.tsx` (si présent)  
- `SuperAdminCockpitClient.tsx`  
- Sidebar SA (`ErpNavSidebar` + `NAV_CONFIG` sections SA) — **gel UX**

### 6.2 Couplage RBAC → SA

| Aspect | SA indépendant ? |
|--------|----------------|
| Path guards SA | **Oui** — branche dédiée `edgeIsSuperAdminOperationalPath` |
| `/dept/*` pour SA | **Oui** — gouvernance allow prefix `/dept` |
| Sidebar non-SA | **Découplée** via `getSidebarForRole` — corrections futures **ne doivent pas** toucher `super_admin_erp` |
| `getLayoutAccess` skip permissions | SA exact → pas de query permissions (perf) |

### 6.3 Risques pour corrections futures

| Risque | Niveau |
|--------|--------|
| Modifier `AppShell.renderSidebar` sans garder branche SA | **HIGH** |
| Unifier path guards sans tester branche SA | **HIGH** |
| Changer `resolvePostLoginRoute` fallback `/dashboard` | **MEDIUM** — affecte non-SA plus que SA |
| Supprimer `ErpNavSidebar` | **CRITICAL** |

**Verdict Phase 5 :** **SAFE** pour SA **si** toute correction cible `department_business` + middleware non-SA uniquement.

---

## 7. RBAC_DEBT_REPORT — Phase 6

### 7.1 Duplications

| ID | Duplication | Class |
|----|-------------|-------|
| D1 | `edge-route-guards` ↔ `permissions.canAccessPathForProfile` | P1 |
| D2 | `nav-config` ↔ `erp-ux-architecture` ↔ `dept-nav-configs` | P1 |
| D3 | `sidebar-for-role` legacy map ↔ `roles.ts` aliases | P2 |
| D4 | `shellRail` vs `resolveSidebarDepartmentKey` | **P0** |
| D5 | `SuperAdminPrimarySidebar` orphan vs `ErpNavSidebar` | P2 |
| D6 | Tests `m3-75` vs code réel AppShell | P2 |

### 7.2 Dette RBAC

| ID | Dette | Class |
|----|-------|-------|
| R1 | Permissions table **role_key only** — pas department-aware | P1 |
| R2 | `isDeptRouteAllowed` legacy parallèle — no-op générique | P1 |
| R3 | Cookie `rempres_role` writable client | P2 |
| R4 | Legacy `/dept/*` allow pour `responsable_*` | P1 |
| R5 | `/api/*` sans middleware RBAC | P1 |
| R6 | `directeur_general` = ErpNav global visuel | P2 (produit) |

### 7.3 Navigation debt

- Liens sidebar vers pages inexistantes (formation, marketing) — **hors RBAC strict** mais confond l’audit utilisateur  
- `department_legacy` path jamais atteint pour `responsable_vente`

---

## 8. Leak exact — analyse du bug observé

### 8.1 Symptôme officiel

> Responsable Vente voit sidebar proche ou complète du Super Admin.

### 8.2 Diagnostic root cause (priorisé)

```
┌──────────────────────────────────────────────────────────────┐
│ LEAK #1 (P0 data) — role_key incorrect en base               │
│   super_admin | directeur_general sur compte "vente"         │
│   → ErpNavSidebar + NAV_CONFIG global                        │
│   Vérification : SELECT role_key, department_key FROM profiles │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ LEAK #2 (P0 logic) — shellRail ignore legacy role alias       │
│   responsable_vente + department_key NULL                       │
│   → sidebar mode VENTE mais groups filtrés → rail minimal       │
│   Utilisateur confus / compare à "sidebar cassée / SA"         │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ LEAK #3 (P1 product) — directeur_general = ErpNav global      │
│   FULL_SIDEBAR_ROLES → même composant que SA (filtré)          │
│   Visuellement "SA-like" — intention historique DG             │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ LEAK #4 (P1 legacy) — responsable_vente /dept/* cross-dept    │
│   canProfileAccessDeptPath legacy branch + "/dept" prefix       │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│ LEAK #5 (P2) — /dashboard preload KPI avant redirect non-SA    │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Ce qui n’est PAS un leak

- Manager + VENTE recevant `ErpNavSidebar` **via code actuel** — **non reproduit** si profil DB correct  
- Cookie `rempres_role=super_admin` seul — **ne bypass pas** edge guards

---

## 9. Risk matrix

| ID | Risque | Impact | Prob | Priorité | Zone correction future |
|----|--------|--------|------|----------|------------------------|
| L1 | Mauvais role_key DB | Critique | Moy | **P0** | Admin users / data |
| L2 | shellRail vs legacy alias | Élevé | Élevé | **P0** | `shell-visibility.ts` (non-SA) |
| L3 | API permissions sans dept | Élevé | Moy | **P1** | API routes + permissions seed |
| L4 | Legacy /dept cross-dept | Moyen | Moy | **P1** | `dept-cockpit-route.ts` |
| L5 | Dashboard KPI preload | Moyen | Élevé | **P2** | `dashboard/page.tsx` **hors SA render** |
| L6 | Path guards duplication | Moyen | Faible | **P1** | Unifier import unique |
| L7 | directeur_general global nav | Faible | Certain | **P2** | Produit / migration rôles |
| L8 | Tests m3-75 drift | Faible | Certain | **P2** | Tests only |

---

## 10. MASTER VERDICT + recommandations

### 10.1 Verdict final

# **PARTIAL**

| Critère | Statut |
|---------|--------|
| Source rôle autoritaire (DB) | ✅ |
| Isolation routes manager+VENTE (HTML) | ✅ |
| Sidebar non-SA isolée du code SA | ✅ |
| Cohérence legacy / générique | ❌ |
| API layer isolation | 🟡 |
| Zero confusion UX SA-like | ❌ |
| Single pipeline documenté | 🟡 |

**Ni SAFE** (leaks P0/P1 existent) **ni BROKEN** (middleware bloque cross-dept pour profils canoniques ; factorisation mai a corrigé access-denied `/dept`).

### 10.2 Recommandations correction (Étape 2 — hors scope actuel)

**Ordre strict — audit d’abord, correction ensuite :**

1. **P0 — Data audit :** vérifier en prod les comptes « responsable vente » (`role_key`, `department_key`).  
2. **P0 — shellRail :** aligner `resolveShellRailVisibility` sur `resolveSidebarDepartmentKey` (legacy alias). **Ne pas toucher SA.**  
3. **P1 — Legacy dept paths :** restreindre `canProfileAccessDeptPath` legacy à slug matching.  
4. **P1 — API :** ajouter garde department-aware sur `/api/finance/*`, `/api/dept/*`.  
5. **P1 — Unifier path guards :** single module importé edge + serveur.  
6. **P2 — Dashboard :** redirect non-SA **avant** `getDashboardKpis()` (sans modifier rendu SA).  
7. **P2 — Déprécier :** cookie `rempres_role`, `dept-nav-configs` legacy path, tests m3-75 drift.

---

## 11. RBAC_PERFORMANCE_OBSERVATION — Phase 8

| Zone | Observation | Risque futur |
|------|-------------|--------------|
| `getLayoutAccess` | 1× profile + 1× permissions query (skip SA) | OK — cached React `cache()` |
| Middleware | Profile SELECT chaque requête matched | Acceptable ; headers cache RSC |
| `AppShell` | `useMemo` sidebar resolution | OK |
| Dynamic imports sidebars | 3 chunks (Erp, Dept, Legacy) | OK — code split |
| `getDashboardKpis` preload non-SA | **Gaspillage** — fetch exécutif inutile | P2 perf |
| Pending approvals count | SA only query | OK |

**Pas d’optimisation appliquée** — observation uniquement.

---

## 12. AUDIT_VALIDATION_REPORT — Phase 9

| Check | Résultat | Détail |
|-------|----------|--------|
| `npm run lint` | **PASS** | 0 ESLint errors |
| `npm run build` | **PASS** | Compilation OK |
| `tests/unit/auth-matrix.test.ts` | **PASS** | Cross-dept + SA isolation |
| `tests/unit/m3-75-final-lock.test.ts` | **FAIL** | Test attend `SuperAdminPrimarySidebar` — code utilise `ErpNavSidebar` (**drift préexistant**, non introduit par cet audit) |

**Verdict validation :** **PASS** (audit doc) / **PARTIAL** (suite tests — drift documenté)

---

## Annexes

### A. Fichiers lus (non modifiés)

`middleware.ts`, `edge-route-guards.ts`, `role-routes.ts`, `permissions.ts`, `dept-cockpit-route.ts`, `sidebar-for-role.ts`, `shell-visibility.ts`, `layout-access.ts`, `home-route.ts`, `app-shell.tsx`, `dashboard/page.tsx`, `nav-config.ts`, `dept-nav-configs.ts`, `department-sidebar-nav.ts`, `roles.ts`

### B. Références rapports existants

- `docs/RBAC_CURRENT_STATE_AUDIT.md`  
- `docs/RBAC_FINAL_VALIDATION.md`  
- `docs/ERP_ROLES_ACCESS_MATRIX_M2_REPORT.md`  
- `docs/RBAC_PUSH_REPORT.md`  
- `docs/ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md`

### C. Rappel mission

**AUDIT ONLY — NO FIX — SUPER ADMIN LOCKED**

---

*Document généré — Bloc 1 Étape 1 — RemPres ERP RBAC Master Audit — 24 mai 2026.*
