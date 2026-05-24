# ARCHITECTURE HARD LOCK — Étape 5

**Verdict zone :** LOCKED

## Topology finale

```
profiles (lib/auth/profile-authority.ts)
  → layout-access (cache)
  → Providers → AppShell (unique)
  → navigation-authority / cockpit-authority / shell-authority
  → children (dept / vente / finance / admin)
```

## Structure

| Zone | État |
|------|------|
| `app/(app)/layout.tsx` | AppShell unique |
| Nested layouts | Contenu uniquement (pas de second shell) |
| Sidebars actifs | ErpNavSidebar + DepartmentBusinessSidebar |
| modules/ | Parallèle app/ — dette D5 documentée |

## Ownership

- Navigation : `navigation-authority.ts`
- Cockpit : `cockpit-authority.ts`
- Shell : `shell-authority.ts`
- Admin : `admin-route-registry.ts` (13 pages KEEP)
- Performance : `runtime-performance-registry.ts`

**Registry :** `lib/architecture/architecture-certification-registry.ts`
