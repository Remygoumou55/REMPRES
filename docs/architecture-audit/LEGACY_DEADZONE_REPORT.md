# LEGACY DEAD ZONE REPORT — Bloc 2 Étape 1

**Date :** 22 mai 2026

## Legacy map

| Zone | Count / scope | Active ? | Risk cleanup |
|------|---------------|----------|--------------|
| `app/(app)/admin/**` | **147** page.tsx | Routes existent ; accès **bloqué** non-SA (middleware) | Medium — volume, pas runtime métier |
| `lib/constants/role-routes.ts` | deprecated | Référencé tests/legacy | Low |
| `lib/constants/dept-nav-configs.ts` | deprecated | Orphan chain | Low |
| `components/layout/dept-sidebar-nav.tsx` | 1 file | **Dead** | Low |
| `app-shell/SuperAdminPrimarySidebar*` | 5+ files | **Dead** (tests drift) | Low — **ne pas toucher SA runtime** |
| `DepartmentDashboardPage` + `DepartmentCockpitPlaceholder` | 2 | **Dead** routes | Low |
| `modules/vente/components/cockpit/` | 1 client | **Reference** B2.4 | Low |
| `modules/finance/components/cockpit/` | 1 client | **Reference** B3 | Low |
| `components/dept/dept-dashboard-shell.tsx` | 1 | **Dead** | Low |
| `~140 admin placeholder pages` | many | Shell only | Low si lock maintenu |

## Untracked / doc drift

| File | Statut |
|------|--------|
| `docs/ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md` | **Non versionné** — audit historique mai ; à committer avec cette étape |
| `tests/unit/m3-75-final-lock.test.ts` | **Test drift** — attend composants SA retirés d'AppShell |

## Test drift (non-SA cleanup candidate)

```
m3-75-final-lock.test.ts
  expects: SuperAdminPrimarySidebar, SuperAdminMobileNav
  actual:  ErpNavSidebar, DepartmentBusinessSidebar
```

**Impact :** 2 tests FAIL sur 10 du fichier — **pas un échec runtime**.

## Legacy wrappers actifs (gouvernés)

| Wrapper | Rôle |
|---------|------|
| `profile-authority` legacy role → dept | **Actif** — intentionnel Bloc 1 |
| `edge-route-guards` legacy admin block | **Actif** |
| `vente/dashboard` → `/dept/vente` | **Actif** redirect |
| `finance/dashboard` → `/dept/finance` | **Actif** redirect |

## Verdict legacy

**DIRTY surface / PARTIAL risk** — grande zone `admin/` + clusters fichiers orphelins ; **runtime métier propre** grâce Bloc 1.
