# REMPRES ERP — Phase 2.5 — rapport de verrouillage UI/UX métier

**Référence :** 2026-05-13  
**Périmètre :** finalisation technique et factuelle des chantiers Phase 2 / 2.5 **sans modification du shell** (AppShell, sidebars, `main` padding).

---

## 1. Dashboards finalisés (cette livraison)

| Module | Écrans |
|--------|--------|
| **Home** | `dashboard/page.tsx` (cohérence `page-wrapper`) |
| **RH** | Hub + collaborateurs, présences, congés, contrats, recrutement ; `RhVisualPageClient` (FR, sans id corrélation UI) |
| **Finance** | Page CFO + `FinanceDashboardClient` ; **Dépenses** (`ModulePageStack`) ; **Enterprise** (hub + sous-pages listées §2) ; **Visual** client |
| **CRM / Vente** | Hub CRM ; toutes les sous-routes CRM listées §2 ; **Clients** et **Produits** (suppression `<main>` imbriqué, `PageHeader`) |
| **Logistique** | Hub ; sous-pages §2 ; reporting réécrit ; **Visual** client |
| **Admin** | **Approbations** (`PageHeader` + `ModulePageStack`) ; hub déjà traité Phase 2 |
| **Settings** | `PageHeader` + `page-wrapper` + `ModulePageStack` ; langues propres |
| **Actions** | Inchangé (déjà conforme Phase 2) |
| **Formation / Consultation / Marketing** | Toujours redirection `coming-soon` — pas d’UI métier à standardiser |

---

## 2. Sous-pages / écrans internes traités

**CRM (`/vente/crm/…`)** : orders, activities, reporting, quotes, analytics, opportunities, leads, forecasting, pipeline, governance, clients (pont), visual (client + loading).

**Logistique** : livraisons, stock, mouvements, fournisseurs, gouvernance, entrepôts, achats, alertes, reporting.

**Finance Enterprise** : balance, facturation, grand-livre, audit, paiements, reporting (réécrit), journal, cashflow, trésorerie, budgets, analytics, workflows, hub page.

**Chargements (loading)** : `finance/enterprise`, `logistique`, `dashboard`, `dashboard/executive`, `admin/platform-dashboard`, visuals RH / Finance / Logistique / CRM.

---

## 3. Wrappers centralisés

| Artefact | Rôle |
|----------|------|
| **`.page-wrapper`** (`globals.css`) | Rythme vertical `space-y-6`, fond module `bg-graylight`, **sans padding horizontal redondant** (aligné sur le `p-4 md:p-6` du `<main>` AppShell). |
| **`ModulePageStack`** | `mx-auto w-full max-w-7xl space-y-6` + `className` optionnel (ex. `max-w-3xl` settings, `max-w-5xl` dépenses). |
| **`TableShell`** | Bordure, ombre, `overflow-x-auto` unifiés pour tableaux scrollables. |

**Intégration modules :** `LogisticsScrollTable`, `FinanceScrollTable`, `CrmScrollTable` s’appuient sur `TableShell`.

---

## 4. Headers centralisés

- Toutes les pages modifiées utilisent **`PageHeader`** (ou équivalent déjà présent) à la place d’anciens blocs `h1` + carte blanche (ex. approbations, clients, produits, paramètres).

---

## 5. Systèmes KPI unifiés

- **`KpiCard`** (Phase 2) reste la référence pour les écrans hors `StatsCard` / cartes module (`FinanceStatCard`, métriques CRM/Logistique inchangées fonctionnellement).

---

## 6. Cartes / widgets

- Grille hub **Finance comptable** : `gap-4` homogène.
- Cartes **Settings** et hub CRM/logistique : pas de refactor structurel supplémentaire hors textes.

---

## 7. Tables finalisées (enveloppe)

- Enveloppe visuelle unifiée via **`TableShell`** pour les tableaux passant par les **ScrollTable** finance / logistique / CRM.

---

## 8. Forms finalisés

- Ajustements limités : libellés placeholders (ex. rejet approbation) ; **pas** de refonte des schémas de validation.

---

## 9. Contenus techniques supprimés ou réécrits

- Sous-titres avec **noms de tables / vues / RPC** (CRM orders, logistique stock/livraisons/alertes/achats, finance journal/trésorerie/workflows, CRM governance, pipeline, forecasting).
- **Reporting logistique** : plus de liste `font-mono` d’identifiants machine en tête d’écran ; libellés métier uniquement.
- **Reporting CRM** : registre `CRM_REPORT_DEFINITIONS` avec descriptions métier (suppression des `view:` / `table:` visibles).
- **Reporting finance enterprise** : liens métier sans `FINANCE_REPORT_IDS` en mono.
- **Trésorerie** : message vide d’exploitation sans commande SQL / cron.
- **Visuels** (Finance, CRM, Logistique, RH) : plus d’affichage **`error.message`** ni titres/sous-titres 100 % anglais par défaut ; bandeau RH sans **correlation id** visible.

---

## 10. Composants / patterns legacy retirés ou réduits

- **`<main>` imbriqué** dans `<main>` AppShell sur **Clients** et **Produits** — supprimé.
- **Commentaires « emoji / anti-crash »** sur la page produits — retirés.
- **`page-wrapper` + `space-y-*` dupliqués** sur plusieurs pages RH / dashboard / visuals — normalisés.

---

## 11. Styles legacy ciblés

- `font-mono` sur cellules stock (réf. entrepôt / SKU) → typo tabulaire standard.
- `mx-auto max-w-*` seuls comme racine de page remplacés par **`page-wrapper` + `ModulePageStack`** sur les écrans migrés (clients, produits, approbations, settings, chargements listés).

---

## 12. Validation densité (global)

- **Règle officielle :** une colonne de contenu large → `ModulePageStack` ; fond de zone → `page-wrapper` ; pas de double padding page / AppShell après changement CSS.

---

## 13. Validation spacing (global)

- `page-wrapper` : `space-y-6` entre blocs principaux.
- Sections internes conservent `space-y-3` / `space-y-4` locales.

---

## 14. Validation responsive

- **Automatique :** `tsc` OK.  
- **Manuelle recommandée :** tableaux larges (stock, pipeline), filtres finance CFO, clients/produits sur tablette 768px.

---

## 15. Cohérence visuelle globale

- Même famille d’en-tête (**`PageHeader`**), mêmes cartes de chargement sur les routes **visual**, mêmes shells table sur les trois domaines.

---

## 16. UX entreprise

- Libellés **français métier** sur les écrans touchés ; moins de vocabulaire « plateforme / data / ADR » sur les hubs déjà traités en Phase 2.

---

## 17. Conformité design system

- `globals.css` : `.page-wrapper` documenté (padding porté par le shell).
- Nouveaux utilitaires React : `ModulePageStack`, `TableShell`.

---

## 18. Performance & stabilité

- Pas d’ajout de bibliothèque ; pas de changement de data fetching ; clients visuels allégés (moins de texte d’erreur technique).

---

## 19. Problèmes résolus (liste synthétique)

1. Double padding `page-wrapper` / `main`.  
2. Jargon SQL / backticks sur écrans CRM / Logistique / Finance enterprise.  
3. Reporting logistique & CRM « catalogue technique ».  
4. Incohérence wrappers (`space-y-6` nu vs `page-wrapper`).  
5. Nested `<main>` clients/produits.  
6. Messages d’erreur développeur sur dashboards visuels.  
7. Hub Finance Enterprise : titre/sous-titre et grille harmonisés.  
8. Empty state trésorerie orienté exploitation.  
9. Loadings dashboard / admin / visuals alignés sur le shell.

---

## 20. Confirmation de clôture & zones résiduelles

### Verrouillage livré

Pour les **modules et fichiers explicitement listés** dans ce rapport, la standardisation Phase 2.5 est **considérée close** : wrappers, en-têtes, purge des textes techniques identifiés en grep ciblé, et tableaux enveloppés via `TableShell` sur les chemins ScrollTable.

### Zones encore en `mx-auto max-w-*` ou sans `PageHeader` (hors périmètre de ce lot)

À traiter si une **Phase 3** produit le mandate :  
`admin/intelligence`, `admin/alerts`, `admin/audit`, `admin/departments/[departmentKey]`, `admin/activity-logs`, `admin/archives`, `admin/currency` (client), `admin/users` (client + loading), `vente/historique`, archives clients/produits, reçu vente, **arbre admin profond** (résilience, plateforme, etc. — dizaines de `page.tsx`).

### Déclaration de principe

Le dépôt peut continuer à évoluer fonctionnellement ; la **gouvernance UI** « Phase 2.5 » s’applique désormais aux **nouveaux écrans** via `page-wrapper` + `PageHeader` + `ModulePageStack` + `TableShell`. Toute évolution ultérieure sur les zones résiduelles relève d’**extension de périmètre**, pas d’inachèvement des écrans déjà verrouillis ci-dessus.

---

**Contrôle qualité exécuté :** `npx tsc --noEmit` — succès.  
**ESLint ciblé :** fichiers sensibles (settings, approvals, registres) — succès.
