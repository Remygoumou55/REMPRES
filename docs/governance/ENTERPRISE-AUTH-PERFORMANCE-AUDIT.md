# Audit complet — Gouvernance autorité & performance runtime

**Date :** 2026-05-29  
**Branche :** `main`  
**Périmètre :** Phases 0–5 + durcissement utilisateurs + optimisations perf ciblées

---

## 1. Synthèse exécutive

| Domaine | Verdict | Évolution |
|---------|---------|-----------|
| Autorité ROOT / SA | **OK** | `system_authority`, control plane, matrix engine |
| Protection auto-rôle SA | **OK** | UI + Server Actions (`e8acd50`) |
| Dette legacy `role_key` seul | **FAIBLE** | 4 fichiers HIGH (vs 35+ en Phase 1) |
| Performance auth RSC | **AMÉLIORÉ** | Session cache unifiée, `*-access` matrix |
| SQL production | **ACTION REQUISE** | Appliquer `093` → `096` sur Supabase |

---

## 2. Programme gouvernance (livré)

| Phase | Commit | Livrable |
|-------|--------|----------|
| **0** | `06431eb` | `system_authority`, recovery root, trigger protection |
| **1** | `bf4bea5` | Audit cartographie (`PHASE1-authority-architecture-audit.md`) |
| **2** | `9b1b38a` | `authorization-core.ts`, middleware, RLS `094` |
| **3** | `7738eba` | Root immuable, audit mutations, SQL `095` |
| **4** | `839caa6` | Control plane isolé des départements, SQL `096` |
| **5** | `0d73d3d` | Matrix engine routes + actions |
| **Fix** | `e8acd50` | SA ne peut pas modifier son propre `role_key` |

---

## 3. Architecture runtime actuelle

```
profiles (role_key, system_authority, department_key)
        ↓
control-plane-authority  →  plane: control | business
        ↓
authorization-matrix-engine  →  scope · routes · actions
        ↓
authorization-core  →  canAccessRoute · canExecuteAction
        ↓
middleware (edge) · layout-access · Server Actions · API guards
```

**Source unique décisions :** `lib/auth/authorization-core.ts` + `authorization-matrix-engine.ts`

---

## 4. Inventaire legacy (reproductible)

```bash
npm run audit:phase1
# → docs/governance/phase1-legacy-inventory.json
```

**Dernier run :** 4 fichiers HIGH / 239 avec hits / 2348 scannés

| Fichier HIGH | Action recommandée |
|--------------|-------------------|
| `logistique/commandes/actions.ts` | Thread `systemAuthority` |
| `marketing/leads/actions.ts` | Idem |
| `api/webhooks/receive/[token]/route.ts` | Revue sécurité webhook |
| `lib/server/automation-executor.ts` | Aligner sur matrix |

---

## 5. Optimisations performance (ce livrable)

### 5.1 Session serveur dédupliquée

- **`getServerSessionUser()`** (`React.cache`) — une lecture `auth.getUser()` par requête RSC
- **`admin/users/actions.ts`** : `getCurrentUserId` utilise le cache (plus de second appel Supabase Auth par action)
- **`settings/users/page.tsx`** : session + `canManagePlatformUsers` aligné sur `listUsers` (évite `assertAdminRole` + double auth)

### 5.2 Module access unifié

Fichiers migrés vers `matrix-module-access` (1× `getProfileAuthBrief` par garde, permissions agrégées) :

- `rh-access.ts`
- `formation-access.ts`
- `marketing-access.ts`
- `consultation-access.ts`
- `logistique-access.ts`

**Gain :** moins d’appels redondants `isSuperAdmin` + `getUserRole` + `getProfileAuthBrief` en chaîne.

### 5.3 Déjà en place (inchangé)

- Middleware → headers profil → `getCachedProfileRow` sans requête DB si headers présents
- `getShellLayoutPermissions` / `getModulePermissions` mémorisés par `cache()`
- `optimizePackageImports` (lucide, recharts, react-query) dans `next.config.mjs`

---

## 6. SQL production — ordre d’application

1. `093_system_authority.sql`
2. `restore_profile_root_authority` si compte bloqué
3. `094_rls_governance_system_authority.sql`
4. `095_immutable_root_protection.sql`
5. `096_control_plane_department_isolation.sql`

---

## 7. Validation

```bash
npm run lint
npm run build
npm run test
npx vitest run tests/unit/authorization-matrix-engine.test.ts tests/unit/control-plane-authority.test.ts tests/unit/authorization-core.test.ts
```

---

## 8. Prochaines étapes (hors scope)

- Package `route-policy` partagé edge + `permissions.ts`
- RLS domain SQL (~40 migrations legacy)
- 4 fichiers HIGH restants du inventaire Phase 1
