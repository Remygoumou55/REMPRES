# REMPRES ERP — UI Cleanup + Performance (mai 2026)

**Mode :** chirurgical · POST-P9 · pas de refonte sidebar / cockpit / RBAC

---

## SIDEBAR_CLEANUP_DONE

| Action | Fichier |
|--------|---------|
| Suppression entrée **Globales** | `lib/constants/nav-config.ts` |
| Archives sidebar = 7 dept uniquement | Vente, Finance, RH, Formation, Consultation, Marketing, Logistique |
| `/archives` → `/archives/vente` | `app/(app)/archives/page.tsx` |
| Legacy `/archives/globales` → redirect | `app/(app)/archives/globales/page.tsx`, `lib/constants/nav-route-aliases.ts` |

---

## HOMEPAGE_BAR_REMOVED

La barre horizontale **Archives · Globales · Vente · …** était le bandeau `ArchivesGovernanceNav` (dérivé de `NAV_CONFIG` + `GovernanceChrome`) sur les routes `/archives/*`.

| Action | Fichier |
|--------|---------|
| Retrait `GovernanceChrome` sur module Archives | `app/(app)/archives/layout.tsx` |
| Navigation archives = **sidebar uniquement** (aligné spec archives) | — |
| `/dashboard` (cockpit SA) | **inchangé** — pas de bandeau horizontal |

Code mort retiré : `components/archives/archive-globales-view.tsx`, `getArchiveGlobalesSummary()` dans `lib/server/archives.ts`.

---

## UI_COLLATERAL_AUDIT

| # | Contrôle | Verdict |
|---|----------|---------|
| 1 | Sidebar intacte (ErpNavSidebar, dept sidebars) | OK |
| 2 | Homepage cockpit SA (`SuperAdminCockpitClient`) | OK — pas de bandeau dept archives |
| 3 | Routing `/archives/*`, redirects, aliases | OK |
| 4 | RBAC / middleware / `canAccessPathForProfile` | OK — non modifié |
| 5 | Départements `/dept`, `DEPARTMENTS` | OK |
| 6 | Dashboard KPI / graphiques | OK |
| 7 | Styles / spacing / couleurs | OK — aucun changement visuel hors suppressions |

**Verdict global : SAFE**

---

## PERFORMANCE_OPTIMIZATION_REPORT

| Avant | Après | Impact |
|-------|-------|--------|
| `GovernanceChrome` + `ArchivesGovernanceNav` sur chaque page archives | Layout archives = `{children}` seul | Moins de JS/hydratation client sur `/archives/*` |
| Page globales + 4 requêtes count Supabase | Supprimée (redirect + code mort) | Moins de charge serveur inutile |
| `SuperAdminCockpitClient` re-render parent | `memo()` sur le composant cockpit | Moins de re-renders si parent layout refresh |
| Cache globales `unstable_cache` | Retiré avec la page | Bundle / logique allégés |

---

## FINAL_VALIDATION_REPORT

| Gate | Résultat |
|------|----------|
| `npm run build` | **PASS** (0 erreurs TS) |
| `npm run lint` | **PASS** (0 warnings) |
| `npm test` | 227/232 — 5 échecs **pré-existants** (lockdown SA legacy `SUPER_ADMIN_NAV_GROUPS`, `app-shell` M3.75, actions nav) — **non liés** à ce cleanup |

**Verdict : PASS** pour livraison UI cleanup (build + lint).

---

## PUSH_REPORT

*(Rempli après commit/push)*
