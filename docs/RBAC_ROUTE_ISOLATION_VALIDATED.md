# Route Isolation Validated

**Date:** 2026-05-22  
**Verdict:** **VALIDATED** (aucune modification middleware requise pour ce fix)

## Mécanismes existants

| Couche | Fichier | Comportement |
|--------|---------|--------------|
| Edge | `lib/middleware/edge-route-guards.ts` | Préfixes département, blocage cross-dept |
| App | `lib/auth/permissions.ts` | `canAccessPathForProfile(roleKey, departmentKey)` |
| Dept | `lib/departments/department-config.ts` | `routePrefixes` par département |

## Scénarios attendus

| Utilisateur | URL `/finance` | Résultat |
|-------------|----------------|----------|
| `manager` + `VENTE` | Accès | **Bloqué** (middleware + permissions) |
| `comptable` / `FINANCE` | Accès | **Autorisé** |
| `super_admin` | Accès | Selon règles SA (lecture supervision) |

## Note

La correction sidebar **ne remplace pas** les gardes URL : elle aligne l’UI sur les règles déjà appliquées côté middleware.
