# Performance — Phase 2 (post Bloc 3)

Complète `docs/RUNTIME_PERFORMANCE_CLEANUP_REPORT.md` (Bloc 2 shell) avec des optimisations ciblées sur les chemins serveur les plus coûteux après l’expansion métier Bloc 3.

## Changements

| Zone | Avant | Après |
|------|--------|--------|
| Hubs `/admin/automation`, `/admin/platform`, `/admin/observability` | `publish*Digest` à chaque chargement (bus + DB) | `build*Digest` uniquement ; cache mémoire TTL 120s + `React.cache()` (`lib/performance/cached-admin-digests.ts`) |
| `getLayoutAccess` | Permissions shell puis `countPendingApprovals` | `Promise.all` pour super-admin |
| Snapshot exécutif (`executive-read-placeholder`) | Lignes complètes `sales` / `expenses` pour KPI mois | `getFinanceTreasuryKpis` + comptages `head` pour transactions |
| Graphique revenus 6 mois | 6 requêtes séquentielles | 6 requêtes en parallèle |
| API `GET /api/dept/[deptKey]/kpis` | KPI puis activité | Activité démarrée en parallèle du switch KPI ; `isSuperAdmin` fusionné dans le premier `Promise.all` |
| Bundles client | lucide, recharts, react-query, date-fns | + tree-shake `@radix-ui/react-*` (`next.config.mjs`) |

## Registre

Métriques documentées : `lib/performance/runtime-performance-registry.ts` (`runtime-cleanup-v2`).

## Publication bus (inchangé)

Les fonctions `publishAutomationCockpitDigest`, `publishPlatformCockpitDigest`, `publishObservabilityHubDigest` restent disponibles pour actions explicites (cron, bouton refresh, jobs) — pas au chargement de page hub.

## Pistes phase 3 (non fait)

- Aligner le graphique revenus exécutif sur `financial_transactions` (comme trésorerie) au lieu de `sales`.
- MV / snapshot SQL `061` pour snapshot exécutif persistant.
- Cache snapshot exécutif (mémoire ou Redis) avec clé tenant — pas `unstable_cache` (Supabase utilise les cookies).
- Réduire `force-dynamic` sur pages admin read-only si la fraîcheur 120s est acceptable.

## Validation

```bash
npm run lint
npm run build
```
