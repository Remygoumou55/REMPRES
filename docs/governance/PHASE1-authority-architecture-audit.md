# PHASE 1 — Audit architecture autorité

**Programme :** REMPRES ERP — Enterprise Authorization Stabilization  
**Date :** 2026-05-29  
**Statut :** Audit livré — **aucun refactor applicatif** (lecture + cartographie uniquement)  
**Prérequis :** Phase 0 (`system_authority`, `093_system_authority.sql`, root protection)

---

## Synthèse exécutive

| Domaine | Verdict | Priorité Phase 2+ |
|---------|---------|-------------------|
| Architecture globale | **PARTIAL** — 15 couches d’autorisation empilées | Unifier matrix engine |
| Legacy `role_key` seul | **35+ fichiers HIGH** | Thread `systemAuthority` partout |
| Routes | **MEDIUM** — trous matcher `/profil`, `/operations`, `/direction`, `/erp` | Étendre middleware |
| Navigation | **MEDIUM** — SA nav ≠ route policy (volontaire zone gelée) | Permission-aware nav |
| Permissions table | **OK structure** — duplication requêtes | Cache unifié |
| Realtime | **LOW security** — pas de fuite auth majeure | Invalidation permissions |
| SQL RLS | **HIGH drift** — ~45 migrations `role_key = super_admin` | Migration RLS 094+ |
| Performance auth | **MEDIUM** — 2–3 lectures profil / requête possible | Headers + cache matrix |

**Verdict global Phase 1 :** Fondations Phase 0 solides ; dette legacy **cartographiée** ; prêt pour Phase 2 (authority layer complet) et Phase 5 (matrix engine) **sans suppression brutale**.

---

## 1. Global Auth Architecture Report (Phase 1.1)

### 1.1 Modèle de données (Supabase / PostgreSQL)

```
auth.users (Supabase Auth)
    └── 1:1 ── profiles
              ├── role_key          (métier : super_admin | manager | agent | …)
              ├── system_authority  (plateforme : ROOT | SUPER_ADMIN | SYSTEM | NONE)  [093]
              ├── department_key / department_id
              ├── is_active, deleted_at
              └── preferred_language, …

departments (référentiel VENTE, FINANCE, RH, …)
permissions (role_key × module_key × can_read|can_write|can_delete|can_approve)
```

| Table / fonction | Rôle dans l’autorité | Fichiers SQL clés |
|------------------|----------------------|-------------------|
| `profiles` | Source identité runtime | `001_core_schema.sql`, `035_*`, `093_system_authority.sql` |
| `permissions` | Capacités fines par module | `003_seed_profiles_permissions.sql`, `035_*` |
| `departments` | Périmètre métier | `035_authorization_generic_roles_departments.sql` |
| `is_super_admin()` | RLS / policies | `093` → `profile_has_root_authority()` |
| `is_admin_role()` | Console admin (manager + ADMINISTRATION) | `035_*` |
| `user_has_module_permission()` | RLS données métier | `022–027`, domaines `04x–08x` |

### 1.2 Stack runtime Next.js (couches)

```mermaid
flowchart TB
  subgraph data [Données]
    AU[auth.users]
    PR[profiles + system_authority]
    PM[permissions]
    RLS[RLS PostgreSQL]
  end

  subgraph edge [Edge]
    MW[middleware.ts]
    EG[edge-route-guards.ts]
    PH[profile-headers x-rempres-*]
  end

  subgraph server [Serveur RSC]
    PRR[getCachedProfileRow]
    LA[getLayoutAccess]
    SP[getShellLayoutPermissions]
    MP[getModulePermissions]
    ISA[isSuperAdmin / hasSystemRootAuthority]
  end

  subgraph ui [UI]
    AS[AppShell]
    ENS[ErpNavSidebar - FROZEN]
    DBS[DepartmentBusinessSidebar]
    GC[GovernanceChrome bands]
  end

  AU --> PR
  PR --> MW
  MW --> PH
  PH --> PRR
  PRR --> LA
  LA --> SP
  LA --> AS
  AS --> ENS
  AS --> DBS
  MW --> EG
  EG -->|deny| AD[/access-denied]
  MP --> Pages
  RLS --> PM
```

### 1.3 Fichiers pivot (ownership)

| Couche | Fichier | Responsabilité |
|--------|---------|----------------|
| Autorité système | `lib/auth/system-authority.ts` | `hasSystemRootAuthority`, normalisation |
| Rôles | `lib/auth/roles.ts` | `ROLE_KEYS`, `isSuperAdminRoleKey`, alias legacy |
| Profil autorité | `lib/auth/profile-authority.ts` | Dept effectif, drift flags |
| Path policy (app) | `lib/auth/permissions.ts` | `canAccessPathForProfile`, `hasAdminConsoleAccess` |
| Path policy (edge) | `lib/middleware/edge-route-guards.ts` | Miroir edge |
| Dept routes | `lib/navigation/route-authority.ts` | Préfixes opérationnels / cockpit |
| Middleware | `middleware.ts` | Session, profil, redirects settings |
| Layout | `lib/server/layout-access.ts` | Bundle sidebar + flags |
| Permissions DB | `lib/server/permissions.ts` | Table `permissions`, `isSuperAdmin` |
| Root guard | `lib/governance/runtime/root-protection.ts` | Dernier root |
| Nav SA (gelé) | `components/layout/app-shell/ErpNavSidebar.tsx` | `filterNavConfig` |
| Nav métier | `lib/navigation/department-sidebar-nav.ts` | Architecture officielle dept |
| Config nav | `lib/constants/nav-config.ts` | `NAV_CONFIG` + rôles |

### 1.4 Dépendances legacy identifiées

| Legacy | Impact | Migration cible |
|--------|--------|-----------------|
| `responsable_*`, `directeur_*` | Alias → `manager`/`agent` + dept | Matrix uniquement |
| `lib/constants/role-routes.ts` | Deprecated, non utilisé middleware | Supprimer Phase 4 |
| Cookie `rempres_role` | UX hint, **non lu** pour deny | Documenter / retirer |
| `profiles_normalize_department` force `department_key=null` si `role_key=super_admin` | Conflit potentiel ROOT+role métier | Trigger 093 + coerce patch |
| RLS `lower(role_key)='super_admin'` | Ignore `system_authority` si 093 non appliqué | `profile_has_root_authority()` |

### 1.5 Incohérences runtime connues

1. **Edge ⊃ App** : middleware passe `system_authority` ; nombreux appels `canAccessPathForProfile(path, role, dept)` **sans** 4e argument.
2. **Permissions React `cache()`** : par requête HTTP seulement — pas invalidées par realtime.
3. **Double redirect login** : middleware → `/` puis `getPostLoginDestination` (pages login/callback sans `system_authority`).

---

## 2. Legacy Role Check Report (Phase 1.2)

**Inventaire machine :** `npm run audit:phase1` → `docs/governance/phase1-legacy-inventory.json`

### 2.1 Comptages (scan codebase TS/TSX/SQL)

| Pattern | Fichiers touchés | Risque |
|---------|------------------|--------|
| `role_key` comme gate unique | **~35 app** | HIGH |
| `super_admin` string | **~42 app**, **~45 SQL** | HIGH (SQL si 093 non prod) |
| `system_authority` / `hasSystemRootAuthority` | **~14 app** | Migré partiel |
| `responsable_*` / `directeur_*` | **~28 app** | MEDIUM (alias) |
| `rempres_role` cookie | **3** (write only) | LOW |

### 2.2 Top 15 fichiers HIGH (action Phase 2)

| # | Fichier | Problème |
|---|---------|----------|
| 1 | `lib/server/api-route-guard.ts` | `canAccessPathForProfile` sans `systemAuthority` |
| 2 | `lib/server/approvals.ts` | `.eq('role_key','super_admin')` |
| 3 | `app/api/webhooks/receive/[token]/route.ts` | Lookup hardcodé super_admin |
| 4 | `app/(app)/logistique/commandes/actions.ts` | Notify par legacy roles |
| 5 | `app/(app)/marketing/leads/actions.ts` | `responsable_vente` query |
| 6 | `lib/server/automation-executor.ts` | Query par role_key |
| 7 | `lib/server/profile-row.ts` | `getSupervisionScope` ignore SA |
| 8 | `hooks/useRealtimeNotifications.ts` | `effectiveAuthRoleKey` client |
| 9 | `lib/server/notifications.ts` | Badge SSR role-only |
| 10 | `lib/navigation/shell-visibility.ts` | `role === SUPER_ADMIN` sans SA |
| 11 | `app/login/page.tsx`, `app/page.tsx`, `CallbackClient`, `SetPasswordForm` | Redirect sans `system_authority` |
| 12 | `lib/server/*-access.ts` (5 modules) | Legacy role Sets |
| 13 | `lib/auth/profile-authority.ts` | Dept depuis role_key seul |
| 14 | `lib/constants/nav-config.ts` | Arrays rôles legacy |
| 15 | `supabase/sql/036–038_governance_*.sql` | RLS role_key only |

### 2.3 Fichiers déjà alignés Phase 0

`middleware.ts`, `lib/auth/system-authority.ts`, `lib/server/permissions.ts` (`isSuperAdmin`), `lib/server/users.ts` (root guards), `app/login/LoginForm.tsx`, `app/access-denied/page.tsx`, `lib/navigation/home-route.ts` (si SA passé), `lib/governance/runtime/root-protection.ts`.

### 2.4 Règle de migration (Phase 2)

> Toute décision **plateforme** (cockpit SA, settings, admin console, dernier root) → `hasSystemRootAuthority({ roleKey, systemAuthority })`.  
> Toute décision **métier** (module vente, finance, RH) → `department_key` + `permissions` table.  
> Ne plus utiliser `role_key === 'super_admin'` seul hors couche compat dans `system-authority.ts`.

---

## 3. Route Governance Map (Phase 1.3)

### 3.1 Préfixes protégés middleware

`/dashboard`, `/dept`, `/settings`, `/vente`, `/admin`, `/auth/set-password`, `/rh`, `/finance`, `/formation`, `/consultation`, `/marketing`, `/logistique`, `/actions`, `/archives`, `/executive`, `/parametres`, `/config`

### 3.2 Matrice gouvernance (extrait)

| Préfixe | Middleware | App `canAccessPath` | Sidebar | Risque |
|---------|------------|---------------------|---------|--------|
| `/dashboard` | Allow all auth | Page redirect non-SA | SA Accueil | MEDIUM |
| `/settings` | Allow all auth | Per-page `isAdminRole` | SA oui ; DG manager non | MEDIUM |
| `/vente` | Dept + SA read-only | Aligné tests | Rail VENTE | LOW |
| `/finance`, `/rh` | Dept ; **SA deny** | Module guards | Rails dept | LOW |
| `/admin/*` | Console gate + matrix | Legacy → settings 308 | SA Admin | LOW–MEDIUM |
| `/dept/*` | Cockpit lock | `canAccessDeptCockpitPath` | Dept home | LOW |
| `/executive` | Admin/SA prefixes | Page asserts | DG links | LOW |

### 3.3 Routes fantômes (hors matcher)

| Route | Protection actuelle | Risque |
|-------|---------------------|--------|
| `/profil` | Session layout only | **HIGH** — aucun RBAC edge |
| `/operations/*` | `operations` module layout | **HIGH** |
| `/direction` | Page `isAdminRole \|\| isSuperAdmin` | **HIGH** |
| `/erp/observability` | `assertErpObservabilityReadAccess` | **HIGH** |
| `/coming-soon` | Layout session | MEDIUM |
| ~140× `/admin/legacy/*` | 308 → settings pour SA | LOW (physiques mais bloqués) |

**Recommandation Phase 2 :** ajouter ces préfixes au `matcher` + règles explicites (même « allow authenticated » pour `/profil`).

### 3.4 Drift edge vs app

| Cas | Middleware | App | Note |
|-----|------------|-----|------|
| `/admin/exports`, `/admin/suppressions` | Edge allowlist | `isSuperAdminGovernancePath` peut diverger | Pages ont asserts archives |
| ROOT + `role_key=manager` | **Allow** SA paths | **Deny** si 4e arg omis | **Critique** |

### 3.5 Flux access-denied / login

- Deny → `/access-denied` → `resolveSafeHomeRoute` (évite boucle `/dashboard` métier).
- Login middleware → `/` → double hop avec `getPostLoginDestination`.

---

## 4. Navigation Governance Report (Phase 1.4)

### 4.1 Deux pipelines sidebar

| Mode | Composant | Source liens | Filtre |
|------|-----------|--------------|--------|
| Super Admin | `ErpNavSidebar` (**gelé**) | `NAV_CONFIG` | `filterNavConfig(userRole)` — **role_key only** |
| Métier | `DepartmentBusinessSidebar` | `OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE` | `shellRail` + `canReadClients/Products` |

**Décision sidebar :** `lib/navigation/sidebar-authority.ts` → `AppShell`.

### 4.2 Bandes gouvernance horizontales

| Phase produit | Module | Fichier |
|---------------|--------|---------|
| Actions | 1.3 | `lib/actions/governance-nav.ts` |
| Archives | 1.4 | `lib/archives/governance-nav.ts` |
| Settings | 1.5 | `lib/settings/governance-nav.ts` |

### 4.3 Mismatches nav ↔ routes

| Scénario | Nav | Route |
|----------|-----|-------|
| SA → liens `/dept/finance` | Visible | `/dept/*` OK ; `/finance` **deny** | By design |
| Manager ADMINISTRATION → `/settings` | **Hidden** (`shellRail.settings=false`) | Middleware **allow** | URL directe possible |
| Non-SA → Accueil `/dashboard` | Peut apparaître | Page redirect | Flash possible |

**Zone gelée :** ne pas modifier `ErpNavSidebar.tsx` en Phase 2 — passer par `NAV_CONFIG` + guards serveur + matrix.

---

## 5. Permission Flow Report (Phase 1.5)

### 5.1 Qui décide quoi

| Décision | Mécanisme | Donnée |
|----------|-----------|--------|
| Accès URL | Middleware + edge guards | `profiles` (pas `permissions`) |
| Accès module CRUD | Page/layout + server actions | `permissions` table |
| Sidebar rails | `shell-visibility.ts` | `permissions.can_read` batch |
| SA cockpit | `layout-access` + dashboard page | `hasSystemRootAuthority` |
| Données DB | RLS | SQL functions |

### 5.2 Chaîne de chargement (par requête)

1. Middleware : `profiles` SELECT (+ headers)
2. `getCachedProfileRow` : headers ou 2e SELECT
3. `getLayoutAccess` : skip permissions si SA ; sinon `getShellLayoutPermissions`
4. Pages : `getModulePermissions([modules…])` — **requête séparée** si clés ≠ shell batch

### 5.3 Fuites / stale

| Issue | Sévérité |
|-------|----------|
| Permissions changées en DB sans `router.refresh()` | MEDIUM |
| Realtime ne invalide pas `getShellLayoutPermissions` | MEDIUM |
| Client `useRealtimeNotifications` utilise role cookie/prop sans SA | MEDIUM |
| Pas de hook `usePermissions` central | LOW (by design RSC) |

---

## 6. Realtime Auth Consistency Audit (Phase 1.6)

| Mécanisme | Fichier | Impact auth |
|-----------|---------|-------------|
| Presence | `hooks/usePresence.ts` | Publie page + dept — **pas de check permission** |
| List sync | `hooks/useRealtimeList.ts` | Data-only ; RLS en DB |
| Notifications | `hooks/useRealtimeNotifications.ts` | **Role-based routing** — drift SA |
| Post-mutation | `hooks/use-app-mutation-refresh.ts` | `router.refresh()` — **seul sync permissions UI** |
| Bridges | `*RealtimeBridge.tsx` (governance, HR, CRM) | Refresh ciblé |

**Risques :** session Supabase refresh OK via middleware ; **pas** de `onAuthStateChange` global dans AppShell ; changement `role_key` en DB → sidebar stale jusqu’à refresh navigation.

---

## 7. Sensitive Actions Report (Phase 1.7)

### 7.1 Mutations identité / autorité

| Action | Fichier | Authorization | Audit | Root guard |
|--------|---------|---------------|-------|------------|
| `updateUserAdmin` | `lib/server/users.ts` | `isSuperAdmin` | activity + audit | **Oui** |
| `updateUserRole` | idem | SA + approval | idem | **Oui** |
| `deactivateUser` | idem | SA | idem | **Oui** |
| HR employee role patch | `modules/hr/.../hr-employee-mutations.ts` | HR guards | partiel | DB trigger 093 |
| Invite user | `users.ts` | SA | oui | coerce patch |

### 7.2 Mutations gouvernées (approval engine)

| Domaine | Fichier pattern | `assertApprovalOrThrow` |
|---------|-----------------|-------------------------|
| Vente clients/produits/historique | `app/(app)/vente/*/actions.ts` | Oui |
| Finance dépenses | `finance/depenses/actions.ts` | Oui |
| Admin archives | `admin/archives/actions.ts` | Oui |
| Admin suppressions | `admin/suppressions/actions.ts` | Oui |

### 7.3 Gaps sensibles

| Gap | Fichier |
|-----|---------|
| Notify admins par `role_key=super_admin` only | `lib/server/approvals.ts` |
| Webhook actor super_admin hardcodé | `app/api/webhooks/...` |
| Automation executor role query | `lib/server/automation-executor.ts` |
| Logistique notify legacy roles | `logistique/commandes/actions.ts` |

---

## 8. Authorization Duplication Report (Phase 1.8)

### 8.1 Couches empilées (15)

1. Supabase Auth (JWT)  
2. `profiles` row  
3. `system_authority` (Phase 0)  
4. `profile-authority` (dept effectif)  
5. `edgeCanAccessPathForProfile`  
6. `canAccessPathForProfile` (duplicate logic)  
7. `supervision.ts` SA envelope  
8. `dept-cockpit-route` lock  
9. `shell-visibility` (sidebar only)  
10. `nav-config` role arrays (SA display)  
11. `permissions` table  
12. Domain `*-access.ts` (×5+)  
13. Page/layout redirects  
14. `api-route-guard.ts` (per handler)  
15. PostgreSQL RLS  

### 8.2 Duplications critiques à unifier (Phase 5)

| Duplication | Fichiers | Stratégie |
|-------------|----------|-----------|
| Path policy ×2 | `edge-route-guards.ts` ↔ `permissions.ts` | Package `@/lib/auth/route-policy` partagé |
| Module access ×5 | `rh-access`, `logistique-access`, … | `assertModuleAccess(dept, module)` |
| isSuperAdmin variants | server / edge / nav string compare | Single `resolvePlatformAuthority()` |
| Post-login redirects ×5 | login, page, callback, set-password, home-route | Single `resolveAuthenticatedLanding(profile)` |

---

## 9. Performance Auth Report (Phase 1.9)

| Chemin | Coût | Note |
|--------|------|------|
| Middleware `profiles` SELECT | 1×/navigation | Incompressible ; inclut `system_authority` |
| Headers → `getCachedProfileRow` | 0× DB si headers OK | **Optimisation Phase 0** `x-rempres-sys-auth` |
| `getShellLayoutPermissions` | 1× batch / non-SA | Skipped SA |
| `getModulePermissions` | +1× si modules ≠ shell keys | Duplication possible même requête |
| Edge guard CPU | O(prefixes) | Pas de loop middleware |
| SA sidebar | `filterNavConfig` O(n) items | Client léger |
| Realtime | Debounced (`usePresence`, notifications) | Pas polling auth |

**Bottlenecks :** pages appelant `getUser()` + `getModulePermissions` redondants ; pas de « render storm » auth identifié post Phase 0.

**Recommandations :**  
- Étendre header cache pour supervision scope.  
- Matrix permission snapshot unique par layout.  
- Tests perf : middleware cold vs warm (hors scope Phase 1).

---

## 10. Enterprise Authorization Matrix Draft (Phase 1.10)

### 10.1 Hiérarchie cible

```
Level 0 — System Authority (profiles.system_authority)
    ROOT | SUPER_ADMIN | SYSTEM | NONE

Level 1 — Platform role (profiles.role_key)
    super_admin | manager | agent | accountant | auditor

Level 2 — Department scope (profiles.department_key / authorityDepartmentKey)
    VENTE | FINANCE | RH | … | ADMINISTRATION | AUDIT

Level 3 — Permission set (permissions table)
    module_key × can_read | can_write | can_delete | can_approve

Level 4 — Route access (route-policy engine)
    pathname → allow | deny | redirect

Level 5 — Action access (server actions / API)
    mutation_key → approval required? + audit
```

### 10.2 Ownership matrix (extrait)

| Ressource | L0 System | L1 Role | L2 Dept | L3 Permissions | L4 Route |
|-----------|-----------|---------|---------|----------------|----------|
| `/dashboard` cockpit | ROOT/SA | super_admin | — | — | SA only |
| `/settings/users` | ROOT/SA | super_admin | — | — | SA + admin console |
| `/vente/clients` | — | manager/agent | VENTE | clients:* | dept prefix |
| `/finance/depenses` | — | * | FINANCE | finance:* | dept prefix |
| `/admin/approvals` | SA/admin | manager+ADMIN | ADMIN | — | governance |
| `/profil` | — | any auth | — | — | **à gouverner** |

### 10.3 Matrice rôle × route (certification actuelle)

Source tests : `tests/unit/auth-matrix.test.ts`, `route-isolation-matrix.test.ts`, `rbac-hard-lock-cert.test.ts`.

| Profil test | Allow exemple | Deny exemple |
|-------------|---------------|----------------|
| super_admin | `/dashboard`, `/settings`, `/vente/historique` | `/finance`, `/vente/nouvelle-vente` |
| manager VENTE | `/vente/clients`, `/dept/vente` | `/finance`, `/dept/finance` |
| manager ADMINISTRATION | `/actions`, `/admin/platform-dashboard` | `/vente/clients` |
| accountant FINANCE | `/finance/depenses` | `/vente/historique` |

**Gap matrix :** ajouter colonne `system_authority=ROOT, role_key=manager` (Phase 2 tests).

---

## 11. Cleanup Strategy Report (Phase 1.11)

### 11.1 Conserver (protégé)

- `SuperAdminCockpitClient`, `ErpNavSidebar`, `/dashboard` page cockpit  
- `edge-route-guards` + tests parity  
- `093_system_authority.sql`, root-protection  
- `permissions` table + RLS (migrer policies, ne pas supprimer)

### 11.2 Migrer (gouverné)

| Item | Vers | Phase |
|------|------|-------|
| Callers sans `systemAuthority` | Thread 4e param / brief | 2 |
| SQL RLS `role_key=super_admin` | `profile_has_root_authority()` | 2–3 |
| `*-access.ts` legacy Sets | Matrix + dept | 4 |
| Post-login redirects | `resolveAuthenticatedLanding` | 2 |
| Matcher ghost routes | middleware rules | 2 |

### 11.3 Déprécier puis supprimer

| Item | Condition |
|------|-----------|
| `lib/constants/role-routes.ts` | Après matrix engine en prod |
| Cookie `rempres_role` | Après audit aucun lecteur |
| Doublon path policy | Après package partagé edge+node |

### 11.4 Ne jamais (interdit)

- Suppression brutale RLS  
- Bypass middleware sauvage  
- Modification non auditée zone gelée SA  

---

## 12. Files / Systems Affected Report (Phase 1.12)

### 12.1 Systèmes touchés

| Système | Fichiers estimés | Impact Phase 2+ |
|---------|------------------|-----------------|
| Auth / profil | 12 | HIGH |
| Middleware / edge | 4 | HIGH |
| Navigation | 10 | MEDIUM |
| Server permissions | 8 | HIGH |
| Domain access | 5+ | MEDIUM |
| Server actions | 40+ | MEDIUM |
| API routes | 15+ | HIGH |
| SQL migrations | 45+ | HIGH |
| Tests unit | 10+ | HIGH |
| Client realtime | 6 | LOW |

### 12.2 Validation Phase 1 (engineering)

| Check | Résultat |
|-------|----------|
| Audit document | Ce fichier |
| `npm run audit:phase1` | Inventaire JSON |
| `npm run lint` | À exécuter au commit |
| `npm run build` | À exécuter au commit |
| Tests auth existants | Non régressés (aucun code métier modifié) |
| Zone gelée SA | Non touchée |

---

## Annexes

### A. Références

- Phase 0 : `docs/runtime-safety/PHASE0-root-authority-recovery.md`
- RBAC historique : `docs/RBAC_MASTER_AUDIT.md`
- Routes : `docs/ROUTE_ISOLATION_REPORT.md`
- Runtime safety : `docs/runtime-safety/README.md`

### B. Prochaines phases (rappel programme)

| Phase | Objectif |
|-------|----------|
| **2** | Authority layer complet — thread SA partout |
| **3** | Multi-root immutable avancé |
| **4** | Super Admin control plane isolé |
| **5** | Authorization Matrix Engine centralisé |

---

*Document généré dans le cadre du programme Enterprise Authorization Stabilization — Phase 1 audit only.*
