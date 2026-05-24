# Audit ERP RemPres — Performance & état dépôt (mai 2026)

## État Git (post-audit)

| Élément | Statut |
|---------|--------|
| Branche `main` | Synchronisée avec `origin/main` après push perf |
| Archives refactor | Commit `a87d726` — déjà poussé |
| Fichier non suivi | `scripts/patch-cockpit.mjs` (script one-shot dev — **non commité**) |
| Build / lint | `npm run build` ✅ · `npm run lint` ✅ |

## Modules livrés récemment (vérifiés)

- **Archives** : sidebar 8 dept, KPI + tables + activité, exports/suppressions → Admin
- **Approbations** : workflow SA, badge sidebar, migration `062_approval_requests.sql`
- **Isolation dept** : responsables limités à leur périmètre sidebar/routes
- **Super Admin cockpit** : inchangé (règle absolue respectée)

## Optimisations performance appliquées

### 1. Middleware allégé (~87 kB → bundle Edge réduit)

- Nouveau `lib/middleware/edge-route-guards.ts` : garde-fous pathname-only **sans** `lucide-react`, `nav-config`, ni `Database` types
- `middleware.ts` n'importe plus `legacy-route-lock` / `permissions` lourds

### 2. Déduplication profil middleware ↔ layout

- `lib/middleware/profile-headers.ts` : injection en-têtes request après lecture profil
- `getCachedProfileRow` lit les en-têtes si `x-rempres-uid` correspond → **0 requête DB supplémentaire** par navigation

### 3. Cache serveur (`unstable_cache`)

- **Archives** (`lib/server/archives.ts`) : cache 30s — globales, dept, suppressions
- **Permissions shell** (`lib/server/permissions.ts`) : cache 60s par `role_key`
- **Invalidation** : `revalidateAdminArchives()`, `revalidateSettings()` → `revalidateTag`

### 4. i18n layout allégé

- `app/(app)/layout.tsx` : `loadShellLocaleMessages` (3 bundles) au lieu de 8

### 5. Code-splitting cockpits dept

- `app/(app)/vente/dashboard/page.tsx` : `VenteCockpitClient` en `dynamic()`
- `app/(app)/finance/dashboard/page.tsx` : `FinanceCockpitClient` en `dynamic()`

## Déjà en place (conservé)

- `optimizePackageImports` lucide / recharts / react-query / date-fns
- Sidebars code-split (`app-shell.tsx`)
- `countPendingApprovals` cache 30s
- `getLayoutAccess` React `cache()` + permissions shell batchées

## Recommandations futures (non bloquantes)

| Priorité | Action |
|----------|--------|
| P2 | `dynamic()` sur pages visual (RH, CRM, logistique, finance) |
| P2 | Cache `getDashboardKpis` avec `unstable_cache` 30–60s |
| P3 | Supprimer doublon SQL `005_approval_requests.sql` si 062 est canonique |
| P3 | Retirer legacy `ArchivesGovernanceHub` si plus référencé |

## Quality gates

- [x] Super Admin dashboard 100% inchangé
- [x] Build 0 erreurs TypeScript
- [x] Lint 0 warnings
- [x] Push GitHub `origin/main`
