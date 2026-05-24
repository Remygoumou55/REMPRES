# RUNTIME OBSERVATION REPORT — Bloc 2 Étape 1

**Date :** 22 mai 2026  
**Mode :** observation uniquement — **aucune optimisation appliquée**

## Auth / layout hot path

| Observation | Détail | Debt |
|-------------|--------|------|
| `getLayoutAccess` | `cache()` React — 1 résolution / requête layout | **Good** |
| Profile row | `getCachedProfileRow` — authority slice unique | **Good** |
| Non-SA permissions | `getShellLayoutPermissions` — 6 domain reads | Medium — nécessaire pour shellRail |
| SA permissions | Skip shell perms when SA | **Good** |

## Middleware

| Metric | Value |
|--------|------:|
| Middleware bundle | **83.2 kB** |
| Matcher | Pages only — `/api/*` excluded |

**Note :** API self-guard pattern (Bloc 1 Étape 5) — pas de changement ici.

## Navigation compute

| Point | Observation |
|-------|-------------|
| `getSidebarForRole` | `useMemo` dans AppShell — stable par role/dept |
| Sidebars | `dynamic()` import — code-split OK |
| `nav-config` filter | Client-side sur chaque render sidebar — acceptable SA volume |
| Dept sidebar | Built from `erp-ux-architecture` — static spec |

## Cockpit / charts

| Component | Pattern |
|-----------|---------|
| `DeptHomePage` | `dynamic(DeptHomeCharts, { ssr: false })` — charts lazy |
| `SuperAdminCockpitClient` | `nextDynamic` + Suspense skeleton |
| `dept/[deptKey]/page` | `force-dynamic`, `revalidate = 0` |

**Debt :** tous les cockpits dept en dynamic SSR-off charts → hydration cost acceptable, documenté.

## Duplicate checks (post-Bloc 1)

| Area | Duplication |
|------|-------------|
| Route guard | **Single** edge + app via `route-authority` |
| Sidebar resolve | **Single** `sidebar-authority` |
| Authority dept | **Single** `profile-authority` |

## Safe observation cleanup

**Aucun appliqué** (règle audit-only). Candidats futurs (zéro risque SA) :

- Supprimer fichiers orphelins **après** tests mis à jour
- Unifier `super-admin-nav` → tests only ou merge doc
- Commit `ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md`

## Verdict performance observation

**PASS observation** — pas de régression détectée ; dette = dynamic charts + 147 admin routes build surface.
