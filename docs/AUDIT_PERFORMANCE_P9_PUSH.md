# Audit performance — P9 (post bus ERP)

**Date :** 2026-05-22

## Validation

| Contrôle | Résultat |
|----------|----------|
| `tsc --noEmit` | OK |
| `vitest run` | 229/229 |
| `next build` | OK (264 pages) |

## Optimisations appliquées

### 1. Layout — profil unifié (`lib/server/profile-row.ts`)

Avant : `getProfileAuthBrief` + `getCachedProfileShellSlice` = **2 requêtes** `profiles` par navigation.

Après : **`getCachedProfileRow`** — 1 requête (React `cache()` dédoublonne dans le rendu).

### 2. Layout — permissions shell batch (`getShellLayoutPermissions`)

Avant : **7 requêtes** `permissions` (clients, produits, finance, rh, logistics, formation, marketing, crm).

Après : **1 requête** avec `.in("module_key", …)` + agrégation mémoire (`shell-permission-helpers.ts`).

Super-admin : **0** requête permissions (inchangé).

### 3. Dashboard KPIs — `cache()`

`getDashboardKpis` mémorisé par rendu RSC → pas de double calcul layout + page.

### 4. Dashboard — code splitting

`SuperAdminCockpitClient` chargé via `next/dynamic` (skeleton, `ssr: true`) → JS Recharts hors chemin critique des autres pages.

### 5. i18n — `loadShellLocaleMessages` (prêt)

Fonction disponible pour charger 3 bundles (common, navigation, errors) ; layout garde `loadLocaleMessages` complet pour éviter clés manquantes settings/admin.

## Impact estimé (utilisateur métier, non super-admin)

| Zone | Avant | Après |
|------|-------|-------|
| Requêtes DB layout auth | ~9 | ~3 |
| Profil | 2 | 1 |
| Permissions | 7 | 1 |

## Suite recommandée

- Route-aware i18n (shell léger + bundles admin sur `/settings` uniquement)
- `unstable_cache` court TTL sur `getDashboardKpis` (30–60s) si charge DB dashboard élevée
- Lazy `DomainMixChart` / `PlatformTrendLine` si First Load dashboard encore lourd
