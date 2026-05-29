# PHASE 5 — Authorization Matrix Engine

**Date :** 2026-05-29  
**Statut :** Implémenté — pas de migration SQL requise

---

## Objectif

Centraliser les décisions **scope → routes → actions** dans un moteur unique, aligné sur la hiérarchie Phase 1–4 :

```
system_authority → department → role → permissions → routes → actions
```

---

## Architecture

| Couche | Fichier |
|--------|---------|
| Règles déclaratives | `lib/auth/authorization-matrix-rules.ts` |
| Moteur sync/async | `lib/auth/authorization-matrix-engine.ts` |
| Types / contrat | `lib/auth/authorization-matrix-foundation.ts` |
| Façade runtime | `lib/auth/authorization-core.ts` (`canExecuteAction` → matrix) |
| Bridge modules | `lib/server/matrix-module-access.ts` |
| Bridge plateforme | `lib/server/matrix-platform-access.ts` |

---

## API principales

| API | Usage |
|-----|--------|
| `resolveMatrixScope(profile)` | Scope matriciel complet (prefixes, modules, actions) |
| `matrixCanAccessRoute(path, profile)` | Routes (aligné `canAccessRoute`) |
| `matrixCanExecuteAction(action, profile)` | Actions gouvernées |
| `createSyncMatrixEngine(profile)` | Moteur lié à un profil RSC |
| `createAuthorizationMatrixEngine({ loadProfile })` | Contrat async API |
| `canManagePlatformUsers(userId)` | Mutations `/settings/users` |

---

## Actions gouvernées

| Action | Règle |
|--------|--------|
| `user.admin.update` / `user.role.update` / `user.deactivate` | `platform_root` |
| `approval.decide` / `governance.export` | `admin_console` |
| `finance.expense.mutate` / `vente.operational.mutate` | `business_operational`, deny control plane |
| `module.read` / `module.write` / `module.delete` | Permissions table + deny SA write |

---

## Migrations runtime

| Fichier | Changement |
|---------|------------|
| `rh-access.ts` | Délègue à `matrix-module-access` (+ legacy roles) |
| `users.ts` | `canManagePlatformUsers` au lieu de `isSuperAdmin` seul |
| `api-route-guard.ts` | `systemAuthority` sur dept cockpit |

**À migrer progressivement :** `formation-access`, `logistique-access`, `marketing-access`, `consultation-access`.

**Déprécié (inchangé) :** `lib/constants/role-routes.ts` — ne plus étendre.

---

## Tests

```bash
npx vitest run tests/unit/authorization-matrix-engine.test.ts tests/unit/authorization-core.test.ts tests/unit/auth-matrix.test.ts
```

---

## Programme gouvernance

Phases 0–5 du programme Enterprise Authorization Stabilization sont **livrées côté runtime core**.

Prochaines évolutions hors scope immédiat :

- Package `route-policy` partagé edge + node (dedup `permissions` / `edge-route-guards`)
- Migration RLS domain SQL (~40 fichiers)
- Extension matrice `can_approve` / export
