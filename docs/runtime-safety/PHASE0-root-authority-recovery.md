# PHASE 0 — Root Authority Recovery & System Control Restoration

**Date :** 2026-05-29  
**Statut :** Correctifs code déployés — **action SQL production requise**

---

## 1. Root Recovery Report

### Symptôme

Le compte root principal a perdu l’autorité Super Admin après modification de `role_key` / `department_key` via l’UI Utilisateurs. Le runtime traitait le profil comme utilisateur métier → `/access-denied`, sidebar départementale, perte de contrôle plateforme.

### Cause racine

| Couche | Problème |
|--------|----------|
| **Données** | `profiles.role_key` modifié (ex. `manager` + `VENTE`) sans colonne d’autorité système immuable |
| **Runtime** | `isSuperAdmin` = strictement `role_key === 'super_admin'` |
| **Mutations** | `updateUserAdmin` sans garde « dernier root » |
| **Navigation** | Autorité couplée au département métier |

### Restauration immédiate (Supabase SQL Editor)

```sql
-- 1) Diagnostic
SELECT id, email, role_key, department_key, system_authority, is_active, deleted_at
FROM public.profiles
WHERE email ILIKE '%VOTRE_EMAIL%';

-- 2) Restauration gouvernée (après migration 093)
SELECT public.restore_profile_root_authority(id)
FROM public.profiles
WHERE email ILIKE '%VOTRE_EMAIL%'
LIMIT 1;

-- 3) Vérification
SELECT id, email, role_key, department_key, system_authority, is_active
FROM public.profiles
WHERE email ILIKE '%VOTRE_EMAIL%';
```

Résultat attendu : `role_key = super_admin`, `department_key = NULL`, `system_authority = ROOT`, `is_active = true`.

---

## 2. Authority Architecture Audit

### Avant

```
profiles.role_key + department_key
        ↓
resolveAuthorityDepartmentKey (SA → ADMINISTRATION)
        ↓
sidebar / middleware / permissions
```

### Après (Phase 0)

```
profiles.system_authority  ← couche système (ROOT | SUPER_ADMIN | SYSTEM | NONE)
        +
profiles.role_key          ← rôle métier / permissions fines
        ↓
hasSystemRootAuthority()
        ↓
middleware + layout + mutations protégées
```

Fichiers clés :

- `lib/auth/system-authority.ts`
- `lib/governance/runtime/root-protection.ts`
- `supabase/sql/093_system_authority.sql`

---

## 3. Permission Consistency Report

| Vérification | État |
|--------------|------|
| `isSuperAdmin()` serveur | Utilise `system_authority` + `role_key` |
| Middleware `edgeCanAccessPathForProfile` | Passe `system_authority` |
| `layout-access` sidebar SA | `hasSystemRootAuthority` |
| Login redirect | `system_authority` lu au sign-in |
| Access-denied home | `resolveSafeHomeRoute` |

---

## 4. Sensitive Mutation Audit

| Mutation | Protection |
|----------|------------|
| `updateUserAdmin` | `assertRootMutationAllowed` + `coerceRootProfilePatch` |
| `updateUserRole` | idem |
| `deactivateUser` | idem |
| DB trigger `trg_profiles_root_protection` | Dernier root non supprimable |

---

## 5. Runtime Security Report

- Trigger PostgreSQL bloque downgrade / désactivation du dernier root actif.
- `is_super_admin()` SQL aligné sur `system_authority` + `role_key`.
- Pas de bypass sauvage : restauration via fonction SQL `service_role` uniquement.

---

## 6. Performance Optimization Report

- Pas de polling auth supplémentaire.
- Une colonne `system_authority` lue dans la requête profil existante (middleware + `getCachedProfileRow`).
- Guards root : un `count` agrégé uniquement sur mutations sensibles (pas par requête page).

---

## 7. Root Protection Validation

Tests : `tests/unit/root-protection.test.ts`

Scénarios couverts :

- Variantes rôle `superadmin` / `super-admin`
- Autorité `ROOT` avec rôle métier → plateforme SA
- Coercion patch super_admin sans département

---

## 8. Files Modified Report

| Fichier | Rôle |
|---------|------|
| `supabase/sql/093_system_authority.sql` | Migration + trigger + restore |
| `lib/auth/system-authority.ts` | Couche autorité système |
| `lib/governance/runtime/root-protection.ts` | Gardes mutations |
| `lib/auth/permissions.ts` | Routes + admin console |
| `lib/middleware/edge-route-guards.ts` | Edge middleware |
| `middleware.ts` | Lecture `system_authority` |
| `lib/server/profile-row.ts` | Cache profil |
| `lib/server/permissions.ts` | `isSuperAdmin` |
| `lib/server/layout-access.ts` | Sidebar SA |
| `lib/server/users.ts` | Mutations protégées |
| `lib/navigation/home-route.ts` | Safe home routes |
| `app/login/LoginForm.tsx` | Post-login |
| `app/access-denied/page.tsx` | Retour accueil |

---

## 9. Risks Prevented Report

| Risque | Mitigation |
|--------|------------|
| Auto-downgrade dernier root | Trigger + guard applicatif |
| Perte SA par changement département | `system_authority` indépendant |
| Boucle access-denied | `resolveSafeHomeRoute` |
| Rôle `superadmin` non reconnu | Alias + normalisation |
| RH modifie un root | Trigger DB |

---

## Checklist déploiement

1. [ ] Exécuter `093_system_authority.sql` en production
2. [ ] Exécuter `restore_profile_root_authority` pour le compte root
3. [ ] Déployer le commit applicatif
4. [ ] Vérifier login → `/dashboard` + sidebar Super Admin
5. [ ] Vérifier qu’une tentative de downgrade du dernier root est refusée

---

## Phases suivantes (hors Phase 0)

- **PHASE 1** — Cartographie complète identité / permissions
- **PHASE 2** — Root Authority Layer complète (UI + audit)
- **PHASE 3** — Immutable root protection multi-tenant
- **PHASE 4** — Isolation Super Admin vs départements
