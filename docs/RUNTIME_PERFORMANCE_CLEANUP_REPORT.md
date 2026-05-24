# RUNTIME PERFORMANCE CLEANUP — Bloc 2 Étape 4

**Date :** 22 mai 2026  
**Verdict :** `OPTIMIZED`

**Super Admin :** `ErpNavSidebar.tsx` **non modifié** — optimisations AppShell shell uniquement.

---

## 1. Contexte

Post-unification (Étape 3). Mission : alléger le runtime sans rewrite React ni redesign UX.

---

## 2. Runtime baseline

| Zone | Baseline |
|------|----------|
| Layout access | `getLayoutAccess()` — React `cache()` / requête |
| Shell i18n | 3 bundles (`common`, `navigation`, `errors`) |
| Providers | 4 niveaux — stack unique |
| Sidebar desktop | **2 instances montées** (drawer + rail) |
| Middleware | 83.2 kB |

**Registry :** `lib/performance/runtime-performance-registry.ts`

→ [`architecture-audit/RUNTIME_AUDIT_REPORT.md`](architecture-audit/RUNTIME_AUDIT_REPORT.md)

---

## 3. Shell optimization (AppShell)

| Optimisation | Impact |
|--------------|--------|
| Sidebar mobile : mount **uniquement** si drawer ouvert | −1 instance sidebar desktop ; mobile idle sans double tree |
| `sidebarContent` useMemo | Évite rebuild sidebar sur re-renders header |
| `EMPTY_SHELL_RAIL` stable | DepartmentBusinessSidebar memo stable |
| `sidebarProps` useMemo | Moins de re-renders ErpNavSidebar props |
| `CurrencySwitcher` dynamic `ssr:false` | Code-split header widget |

**ErpNavSidebar : fichier inchangé.**

→ [`architecture-audit/SHELL_OPTIMIZATION_REPORT.md`](architecture-audit/SHELL_OPTIMIZATION_REPORT.md)

---

## 4. Provider governance

Stack documentée — pas de duplication :

`I18nProvider` → `QueryClientProvider` → `ToastProvider` → `CurrencyContextProvider`

**Module :** `lib/performance/provider-governance.ts`

→ [`architecture-audit/PROVIDER_GOVERNANCE_REPORT.md`](architecture-audit/PROVIDER_GOVERNANCE_REPORT.md)

---

## 5. Hydration cleanup

| Action | Détail |
|--------|--------|
| CurrencySwitcher | Client-only dynamic — réduit hydration header initiale |
| Mobile sidebar | Pas de mount drawer contenu si fermé |
| DeptHomeCharts | Déjà `ssr:false` (inchangé) |

→ [`architecture-audit/HYDRATION_REPORT.md`](architecture-audit/HYDRATION_REPORT.md)

---

## 6. Bundle optimization

- CurrencySwitcher + currency context chargés après shell initial
- Sidebars déjà dynamic import (conservé)
- Admin legacy −134 pages (Étape 2) — build surface réduite

→ [`architecture-audit/BUNDLE_REPORT.md`](architecture-audit/BUNDLE_REPORT.md)

---

## 7. Performance matrix

| AREA | BEFORE | AFTER | RESULT |
|------|--------|-------|--------|
| Sidebar mount desktop | 2 | 1 | **improved** |
| shellRail default | new object/render | EMPTY_SHELL_RAIL | **improved** |
| sidebarProps | inline object | useMemo | **improved** |
| CurrencySwitcher | static import | dynamic | **improved** |
| layout-access cache | cache() | cache() | neutral |
| shell i18n | 3 bundles | 3 bundles | neutral |
| middleware | 83.2 kB | 83.2 kB | neutral |

Tests : `tests/unit/runtime-performance-matrix.test.ts` (11)

→ [`architecture-audit/PERFORMANCE_MATRIX_REPORT.md`](architecture-audit/PERFORMANCE_MATRIX_REPORT.md)

---

## 8. Dette restante

| ID | Item |
|----|------|
| R1 | Desktop aside hidden on mobile still in DOM (CSS) — acceptable |
| R2 | Mobile drawer open = 2 instances temporaires |
| R3 | Currency refresh background fetch (by design) |
| R4 | Profiling RUM production non instrumenté |

---

## 9. Verdict

### `OPTIMIZED`

Gains mesurables documentés, zero regression tests (69 ciblés PASS), SA pixel-identique.

Build + lint : **PASS**
