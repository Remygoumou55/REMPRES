# PHASE 3 — Immutable Root Protection

**Date :** 2026-05-29  
**Statut :** Implémenté — SQL `095_immutable_root_protection.sql` à appliquer après `093`

---

## Objectifs

1. Empêcher la perte du dernier root plateforme (app + DB)
2. Empêcher la perte du dernier détenteur `system_authority = ROOT`
3. Restreindre l’octroi ROOT aux seuls comptes ROOT
4. Bloquer l’auto-rétrogradation du dernier root
5. Auditer toutes les mutations d’autorité sensibles
6. Étendre la protection aux mutations RH

---

## Architecture

```
immutable-root-policy.ts (pure)
        ↓
root-protection.ts (DB counts + assertImmutableRootPolicy)
        ↓
guard-profile-authority-mutation.ts
        ↓
users.ts · hr-employee-mutations.ts
        ↓
profiles_enforce_root_protection (trigger 095)
```

---

## Règles immuables

| Code | Règle |
|------|--------|
| `LAST_PLATFORM_ROOT` | Dernier root actif non désactivable / non rétrogradable |
| `LAST_STRICT_ROOT_AUTHORITY` | Dernier `ROOT` ne peut pas passer à `SUPER_ADMIN` / `NONE` |
| `ROOT_GRANT_FORBIDDEN` | Seul un appelant `system_authority=ROOT` peut promouvoir ROOT |
| `SELF_ROOT_DEMOTION` | Le dernier root ne peut pas se retirer lui-même l’autorité |

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `lib/governance/runtime/immutable-root-policy.ts` | Politique pure testable |
| `lib/governance/runtime/root-protection.ts` | Guards + compteurs |
| `lib/governance/runtime/authority-mutation-audit.ts` | Audit `governance_audit_events` |
| `lib/governance/runtime/guard-profile-authority-mutation.ts` | Entrée unique mutations |
| `supabase/sql/095_immutable_root_protection.sql` | Trigger DB renforcé |
| `modules/hr/server/services/hr-employee-mutations.ts` | Guard RH |

---

## SQL production

```sql
-- Après 093 et 094
\i supabase/sql/095_immutable_root_protection.sql
```

---

## Tests

`tests/unit/immutable-root-policy.test.ts`  
`tests/unit/root-protection.test.ts`

---

## Phase suivante

**PHASE 4** — [Super Admin Isolation](./PHASE4-super-admin-isolation.md) (livré).
