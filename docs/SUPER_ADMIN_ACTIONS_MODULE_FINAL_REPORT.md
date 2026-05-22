# Rapport final — Phase 1.3 Module **Actions** (super_admin / administration gouvernance)

**Produit :** RemPres ERP  
**Périmètre :** Centre de contrôle gouvernance (hub `/actions`, centres `/admin/*` alignés), navigation unifiée, suppression de l’ancienne voie « intelligence » métier sous le masque « Activité système ».  
**Date :** 2026-05-14  
**Ton du rapport :** strict, honnête, sans sur-promesse ni « 100 % terminé » marketing.

---

## 1. Éléments supprimés

- `app/(app)/actions/ActionsPageClient.tsx` (hub minimal 3 cartes).
- `app/(app)/admin/intelligence/page.tsx` — **contenu analytique / KPI métiers** (grilles, comparaisons départements, tendances ventes) remplacé par une **redirection** vers `/admin/platform-dashboard`.
- Composants et chargeur devenus orphelins après suppression de la page intelligence :
  - `components/governance/analytics/IntelligenceRealtimeBridge.tsx`
  - `GovernanceSummaryGrid.tsx`, `GovernanceKpiCard.tsx`
  - `DepartmentComparisonTable.tsx`, `EnterpriseTrendChart.tsx`, `EnterpriseHealthScore.tsx`
  - `AnalyticsPeriodFilter.tsx`, `ApprovalAnalyticsCard.tsx`, `IncidentAnalyticsCard.tsx`
  - `lib/governance/analytics/enterprise-intelligence.ts`  
  *(Les agrégateurs sous `lib/governance/analytics/aggregators/*` et les tests unitaires associés sont **conservés**.)*

---

## 2. Validation — structure officielle Actions

Structure cible documentée dans `lib/actions/governance-nav.ts` (`GOVERNANCE_ACTIONS_NAV`) :

| Entrée | URL |
|--------|-----|
| Vue d’ensemble | `/actions` |
| Approbations | `/admin/approvals` |
| Alertes | `/admin/alerts` |
| Audit | `/admin/audit` |
| Journaux | `/admin/activity-logs` |
| Activité système | `/admin/platform-dashboard` |

Bandeau horizontal : `ActionsGovernanceNav` + `ActionsGovernanceChrome` branchés sur `app/(app)/actions/layout.tsx` et `app/(app)/admin/layout.tsx`, affichés **uniquement** sur les chemins listés par `isGovernanceActionsPath` (pas sur `/admin/users`, etc.).

Rail super_admin : `lib/navigation/super-admin-nav.ts` — lien « Activité système » pointe vers **`/admin/platform-dashboard`** ; libellé hub `/actions` normalisé via `NAV_LABELS.actionsOverview` (**« Vue d'ensemble »**, hotfix `docs/SUPER_ADMIN_ACTIONS_NAV_SYNTHESIS_HOTFIX_REPORT.md`).

---

## 3. Validation — Approvals Center

- Aucun changement fonctionnel des actions serveur (approuver / rejeter) : page `app/(app)/admin/approvals/page.tsx` inchangée sur le fond.
- Le centre reste **validation humaine** (cartes + filtres), pas un workflow métier déporté.

---

## 4. Validation — Alerts Center

- Enveloppe visuelle : `page-wrapper` + `max-w-6xl` sur `app/(app)/admin/alerts/page.tsx` pour alignement avec les autres centres.

---

## 5. Validation — Audit Center

- Même enveloppe `page-wrapper` + `max-w-6xl` sur `app/(app)/admin/audit/page.tsx`.

---

## 6. Validation — Journals Center

- Titres / sous-titre `PageHeader` sur `app/(app)/admin/activity-logs/page.tsx` : explicitation **journal applicatif / système**, distinct de l’audit métier.
- `page-wrapper` ajouté sur le conteneur principal.

---

## 7. Validation — Activité système

- **Source unique** pour la supervision plateforme : `/admin/platform-dashboard` (modèle existant `getAdminPlatformOverviewModel` / `PlatformCommandCenter`).
- `/admin/intelligence` → **redirection permanente** (compatibilité signets / liens anciens).
- Les liens internes (compliance, observability, AI, etc.) pointent vers **`/admin/platform-dashboard`** à la place de `/admin/intelligence`.

---

## 8. Validation — séparation audit / journaux

- Distinction renforcée par le libellé des journaux et par la documentation dans le hub (`ActionsGovernanceHub`).
- Données : audit = `governance_audit_events` ; journaux = `activity_logs` (inchangé côté schéma).

---

## 9. Validation — responsive

- Bandeau Actions : défilement horizontal masqué sur petits écrans (`overflow-x-auto` + scrollbar masquée), pastilles tactiles ≥ 44 px via padding des liens.

---

## 10. Validation — mobile

- Pas de campagne de tests navigateur automatisés dans cette livraison ; revue structurelle + `tsc` OK.

---

## 11. Validation — permissions

- Hub `/actions` : inchangé — `isAdminRole` **ou** `isSuperAdmin` (comme avant).
- Centres gouvernance sensibles (approvals, alerts, audit) : **`isSuperAdmin`** inchangé sur les pages existantes.
- Journaux : **`isAdminRole`** inchangé (les administrateurs non super peuvent toujours consulter les logs applicatifs si la politique métier le prévoit).

---

## 12. Validation — factorisation

- Source unique des entrées : `lib/actions/governance-nav.ts`.
- Composants UI : `ActionsGovernanceNav`, `ActionsGovernanceChrome`, `ActionsGovernanceHub`.
- Compteurs hub : `lib/server/actions-governance-overview.ts` (requêtes `count` / `head`).

---

## 13. Validation — performance

- Le hub exécute **un lot parallèle** de comptages légers (pas de chargement des listes complètes sur `/actions`).
- Pas d’hydratation supplémentaire lourde sur le hub (page serveur + petit client pour le hub uniquement).

---

## 14. Problèmes résolus

- Hub Actions trop pauvre et non aligné sur les 5 piliers + vue d’ensemble.
- **Hybride** « Activité système » = page intelligence **métier / stratégique** : corrigé par redirection + lien navigation vers le pilotage plateforme.
- Incohérence visuelle (certaines pages sans `page-wrapper`).

---

## 15. Risques restants

- **Tableaux** (approbations, alertes) : listes paginées côté serveur avec limite fixe (ex. 120 / 150) — pas de pagination « next » complète ni **export / bulk** généralisés sur tous les centres (exigences phase 8 partiellement **non** couvertes ici).
- **Tri / recherche** : audit dispose déjà de `q` et pagination ; les autres centres restent sur le niveau de maturité existant.
- **Doublons sémantiques** : le groupe Archives du rail contient encore un lien vers `/admin/audit` (« Traces conformité ») — chevauchement navigationnel **résiduel** (hors périmètre strict « Actions » dans ce lot).
- **i18n** : clés `navigation.superadmin./admin/intelligence` remplacées par `./admin/platform-dashboard` dans les JSON ; toute autre référence dynamique à l’ancienne clé hors dépôt pourrait manquer de libellé.

---

## 16. Confirmation officielle (bornée)

Pour le périmètre livré dans le dépôt :

- Le **module Actions** dispose d’une **structure officielle** documentée dans le code, d’un **hub** avec indicateurs réels, d’un **bandeau de navigation** cohérent sur le hub et les centres associés, et d’une **activité système** alignée sur le **pilotage plateforme** sans conserver l’écran intelligence métier sous ce nom.

Cela ne constitue **pas** une certification exhaustive « enterprise-grade » au sens QA / sécurité / charge ; les écarts listés en section 15 restent à traiter si l’exigence phase 8 doit être tenue **à la lettre** partout.
