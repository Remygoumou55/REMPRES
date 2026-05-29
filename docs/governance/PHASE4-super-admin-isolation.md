# PHASE 4 — Super Admin Control Plane Isolation

**Date :** 2026-05-29  
**Statut :** Implémenté — SQL `096_control_plane_department_isolation.sql` à appliquer après `093`–`095`

---

## Objectif

Découpler le **control plane ERP** (ROOT / SUPER_ADMIN) des **départements métiers** :

- Plus de dérivation `super_admin → ADMINISTRATION` dans `resolveAuthorityDepartmentKey`
- `department_key` DB ignoré pour l'autorité métier quand `system_authority` est ROOT/SUPER_ADMIN
- Shell chrome (présence, labels) sans tag département pour les acteurs control plane
- Sidebar SA inchangée (`ErpNavSidebar` gelé) — résolution via `isSuperAdmin` + `system_authority`

---

## Architecture

```
profiles (role_key, system_authority, department_key)
        ↓
control-plane-authority.ts  →  plane: control | business
        ↓
profile-authority.ts      →  authorityDepartmentKey (null si control)
        ↓
sidebar-authority · shell-visibility · home-route · layout-access
```

**Fichier pivot :** `lib/auth/control-plane-authority.ts`

| API | Rôle |
|-----|------|
| `isControlPlaneActor` | ROOT / SUPER_ADMIN (+ compat `role_key`) |
| `resolveAuthorityPlane` | `"control"` \| `"business"` |
| `resolveShellDepartmentKey` | `null` en control plane pour chrome |
| `resolveNavigationContext` | Contexte navigation unifié |

**Authorization Core :** `resolveAuthorityScope` expose `plane` et `isControlPlane`.

---

## Changements runtime

| Zone | Avant | Après |
|------|--------|--------|
| `resolveAuthorityDepartmentKey` | SA → `ADMINISTRATION` | SA/ROOT → `null` |
| ROOT + `manager` + `VENTE` | Risque rail/sidebar métier | Control plane, `ErpNavSidebar` |
| `layout-access` | `departmentKey` brut au shell | `shellDepartmentKey` null si control |
| Header nav context | « Vue ERP » | « Control plane ERP » |

**Zones gelées (non modifiées) :** `ErpNavSidebar.tsx`, `SuperAdminCockpitClient`, `app/(app)/dashboard/page.tsx`

---

## SQL production

Ordre :

1. `093_system_authority.sql`
2. `094_rls_governance_system_authority.sql`
3. `095_immutable_root_protection.sql`
4. **`096_control_plane_department_isolation.sql`** — nettoie `department_key` résiduel sur profils plateforme

---

## Tests

- `tests/unit/control-plane-authority.test.ts`
- `tests/unit/profile-authority.test.ts` (SA → null)
- `tests/unit/sidebar-authority.test.ts` (ROOT + manager)
- `tests/unit/authorization-core.test.ts` (inchangé, compatible)

---

## Phase suivante

**PHASE 5** — [Authorization Matrix Engine](./PHASE5-authorization-matrix-engine.md) (livré).
