# REMPRES ERP — Phase 2 (Dashboard & pages) — rapport maître

**Périmètre de cette itération :** standardisation ciblée sans modification du shell global (sidebar, topbar, layouts parents), sans nouvelle fonctionnalité métier.  
**Date de référence :** 2026-05-13.

---

## 1. Dashboards standardisés

| Zone | État |
|------|------|
| **RH** (`app/(app)/rh/page.tsx`) | Grille d’accès rapide factorisée via `HubLinkCard` ; libellés métier (accents, formulations opérationnelles). |
| **Finance** (`finance/page.tsx`, `FinanceDashboardClient.tsx`) | Contenu principal sous `page-wrapper` unique côté page ; client en `space-y-6` ; libellé temps réel (remplace « Live »). |
| **Dépenses** (`finance/depenses/page.tsx`) | Enveloppe `page-wrapper` ; grille KPI `gap-4`. |
| **Logistique** (hub) | `page-wrapper`, sous-titres et sections sans jargon SQL / backticks. |
| **CRM / Vente** (hub `/vente/crm`) | Aligné logistique : titres métier, liens transverses sans noms de tables. |
| **Admin** (hub) | Cartes réécrites opérateur ; titres alignés sur la typo `section-title` (sans conflit de marges). |
| **Départements** | Chaînes de secours i18n avec accents. |

*Non traités dans ce lot :* dashboards « Marketing / Formation / Consultation » s’ils restent des redirections minimalistes ; autres sous-pages module par module.

---

## 2. Pages standardisées (fichiers touchés)

- `app/(app)/rh/page.tsx`
- `app/(app)/logistique/page.tsx`
- `app/(app)/vente/crm/page.tsx`
- `app/(app)/admin/page.tsx`
- `app/(app)/dept/page.tsx`
- `app/(app)/finance/page.tsx`
- `app/(app)/finance/FinanceDashboardClient.tsx`
- `app/(app)/finance/depenses/page.tsx`
- `app/(app)/finance/depenses/DepensesClient.tsx`

---

## 3. Headers centralisés

- **`PageHeader`** (`components/ui/page-header.tsx`) : balise `<header>`, marge basse `mb-8`, titre `text-2xl sm:text-3xl tracking-tight`, sous-titre `max-w-2xl` / `text-gray-600`, zone actions alignée à droite avec `shrink-0`.
- Toutes les pages modifiées continuent d’utiliser ce composant comme **seul modèle** de en-tête de page (pas de second système introduit).

---

## 4. Système KPI unifié

- **`KpiCard`** aligné sur le modèle **`StatsCard`** : `<article>`, bordure gauche `border-l-4`, label en `uppercase tracking-wider`, valeur `text-3xl`, icône en pastille `rounded-full`, tendances en `rounded-badge` si présentes.

---

## 5. Système de cartes / liens hub

- Nouveau **`HubLinkCard`** (`components/ui/hub-link-card.tsx`) : carte lien unique (Next `Link` ou `<a>` pour exports), classes alignées sur les cartes existantes (`card`, hover bordure primary, focus visible).

---

## 6. Tables — état

- Aucun refactor massif des tables dans ce lot (évite les régressions sur virtualisation, ex. clients).
- **Recommandation résiduelle :** introduire un wrapper commun (`TableShell`) sur les vues liste prioritaires, hors chemins virtualisés sensibles.

---

## 7. Forms — état

- Pas de refonte des champs ; cohérence indirecte via `PageHeader` et espacement KPI dépenses.

---

## 8. Labels techniques supprimés / adoucis

- Hubs **Logistique** et **CRM** : suppression des références explicites aux tables / schémas et des sous-titres « plateforme ».
- **Admin** : suppression du vocabulaire ADR, chaos, refactor, « second orchestrateur », etc.

---

## 9. Contenus « développeur » retirés ou remplacés

- Barre Finance : « Live » → **Temps réel**.
- Liens « Operations Center » → formulations **Vue analytique** / **Pilotage département** (FR métier).

---

## 10. Densité & espacement

- Grilles KPI dépenses : `gap-4`.
- `PageHeader` : espacement vertical renforcé (`pb-6`, `mb-8`) pour hiérarchie ERP.

---

## 11. Validation responsive (ce lot)

- Grilles existantes (`sm:`, `lg:`) conservées ; pas de changement de breakpoints.
- **À valider manuellement / E2E :** finance (filtres + barre d’actions), hubs logistique/CRM à largeur intermédiaire.

---

## 12. Modules validés (smoke logique)

- RH, Finance (dashboard + dépenses), Logistique (hub), CRM (hub), Admin (hub), Départements : compilation TypeScript + ESLint OK.

---

## 13. UI partagée centralisée

- `PageHeader`, `HubLinkCard`, `KpiCard` (évolution), réutilisation inchangée de `StatsCard`, `card`, `section-title`, `page-wrapper`.

---

## 14. Composants legacy

- Aucune suppression de composant legacy majeur ; **réduction** des patterns ad hoc de cartes-lien sur le hub RH au profit de `HubLinkCard`.

---

## 15. Conformité design system

- Typographie et hiérarchie des en-têtes harmonisées au composant unique.
- Cartes KPI : même langage que `StatsCard` (article, bordure accent, typo).

---

## 16. Conformité navigation

- Aucune modification des routes, `ROUTES`, ou matrices de permissions.

---

## 17. Performance & stabilité

- Pas de nouvelle couche de state ; pas de duplication de providers.
- `dynamic()` Finance : état de chargement allégé (évite double `page-wrapper`).

---

## 18. Risques résiduels (factuels)

1. **Couverture partielle** : nombreuses sous-pages (RH congés, vente catalogue, settings, etc.) n’ont pas été repassées.
2. **Hubs** : cartes « accès rapide » logistique/CRM restent des `Link` inline (cohérent visuellement mais pas encore factorisées en `HubLinkCard`).
3. **Finance** : libellé « Espace Enterprise » inchangé sur le dashboard client (produit métier vs wording — à trancher produit).
4. **Double `space-y`** : `page-wrapper` inclut déjà `space-y-6` ; vérifier les pages qui empilent beaucoup de sections pour éviter doubles espacements si un jour on compose plusieurs wrappers.

---

## 19. Problèmes résolus (liste)

- Sous-titres hubs logistique/CRM avec **noms de tables** et anglicismes techniques.
- Hub **Admin** avec textes **architecture / plateforme** non adaptés aux opérateurs.
- **RH** : cartes-lien disparates et libellés sans accents / trop « produit ».
- **Finance** : libellé anglais « Live » ; padding dupliqué page/client ; lien visuel en anglais « Operations Center ».
- **Dépenses** : KPI visuellement hors famille `StatsCard`.
- **Départements** : fallbacks sans accents.

---

## 20. Synthèse exécutive

Cette passe **ancre** le header officiel, unifie les **KPI cards** critiques (dépenses), introduit un **pattern de liens hub** réutilisable, et **purge le jargon développeur** sur les hubs logistique, CRM et admin. La dette restante est surtout **volume** (autres modules et tables) et **homogénéisation** des grilles d’accès rapide hors RH.

**Contrôle qualité exécuté :** `npx tsc --noEmit`, `npm run lint` — succès.
