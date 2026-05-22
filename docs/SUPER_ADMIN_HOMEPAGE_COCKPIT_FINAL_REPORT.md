# Rapport final — Phase 1.2 Homepage `SUPER_ADMIN` (cockpit ERP)

**Produit :** RemPres ERP  
**Périmètre :** Remplacement de l’accueil « centre d’aide / gouvernance textuelle » par un **cockpit de supervision** pour le rôle `super_admin`.  
**Date du rapport :** 2026-05-14  
**Statut :** livraison technique réalisée sur la base du code actuel ; **aucune promesse « 100 % terminé »** au-delà de ce qui est vérifiable dans le dépôt.

---

## 1. Éléments supprimés de la homepage `super_admin`

- Rendu de `GovernanceHomeCenter` sur `/dashboard` pour les utilisateurs `super_admin`.
- Chargement associé de `getGovernanceHomeModel` dans `app/(app)/dashboard/page.tsx` pour ce flux (le module `lib/governance/home-config` reste utilisé par les tests unitaires et par `DepartmentDashboardPage`).
- Blocs « mission du rôle », « règles », « actions autorisées / interdites », onboarding textuel, et cartes d’aide qui constituaient l’ancienne homepage super admin.

---

## 2. Validation — suppression du « help center » sur la homepage

- La route `/dashboard` pour `super_admin` ne sert plus de page documentaire : elle charge un **payload cockpit** (`getSuperAdminCockpitPayload`) et le composant `SuperAdminCockpitClient`.
- Un centre d’aide dédié pourra être branché **plus tard** sur une route séparée sans réintroduire ces blocs sur l’accueil.

---

## 3. Validation — structure cockpit ERP

Ordre respecté dans `SuperAdminCockpitClient` :

1. Header exécutif (salutation, date, heure, état plateforme, priorités).
2. KPI globaux (grille responsive).
3. Graphiques globaux (évolution 7 j., tendance ligne, mix par département).
4. Alertes rapides (aperçu + lien vers `/admin/alerts`).
5. Activité récente globale (`ActivityTimeline` sur `kpis.recentActivity`).
6. Supervision départements (cartes aperçu avec lien `/dept/...`).
7. Actions rapides gouvernance (`/admin/approvals`, `/admin/alerts`, `/admin/audit`, `/archives`, `/admin/users`).

---

## 4. Validation — KPI globaux

| KPI | Source de vérité |
|-----|------------------|
| Revenus globaux (mois) | Agrégat finance du snapshot exécutif (`domains.finance.revenue`). |
| Ventes globales (volume) | `getDashboardKpis` (compte + CA net mois). |
| Dépenses globales (mois) | Snapshot exécutif (`domains.finance.expenses`). |
| Bénéfice net (mois) | Snapshot exécutif (`domains.finance.margin`). |
| Employés actifs | `domains.rh.activeContracts`. |
| Formations actives | **N/D** tant que le domaine `formation` reste en `placeholder` dans le snapshot exécutif. |
| Campagnes actives | **N/D** tant que le domaine `marketing` reste en `placeholder`. |
| Stock critique | Stocks faibles + ruptures (`dashboard-kpis`). |
| Validations en attente | `approval_requests` en `pending`. |

Chaque carte KPI réutilise le composant factorisé `CockpitMetricCard` (tendance % sur 7 j. pour revenus / volume ventes, mini-sparkline optionnelle sur le revenu).

---

## 5. Validation — graphiques

- **Évolution revenus (7 j.)** : `SalesChart` (chargement dynamique, pas de SSR lourd).
- **Tendance CA net (7 j.)** : `PlatformTrendLine` (Recharts, même série que les ventes 7 j.).
- **Activité par département** : `DomainMixChart` (Recharts barres) sur indicateurs principaux par domaine issus du snapshot exécutif.

Limitation assumée : pas d’historique 30 j. côté `getDashboardKpis` — les graphiques « mensuels » au sens strict s’appuient sur les agrégats **mois en cours** (KPI) et **7 jours** (courbes).

---

## 6. Validation — alertes rapides

- Alimentation : lignes `governance_alerts` **non lues** (severities low → critical), complétées par signaux **réels** issus des KPI (ruptures stock, suppressions clients 24h) et par les validations en attente **sans doublon** si une alerte gouvernance couvre déjà le thème (heuristique sur le titre).
- Lien « Voir tout » vers `/admin/alerts` — l’aperçu ne remplace pas la file complète.

---

## 7. Validation — activité récente

- Réutilisation de `ActivityTimeline` et des six derniers événements `activity_logs` déjà enrichis par `getDashboardKpis`.
- Pas de journal technique exhaustif.

---

## 8. Validation — supervision départements

- Six cartes : Vente, Finance, RH, Formation, Marketing, Logistique.
- Contenu limité à statut de santé / agrégation, indicateur principal, nombre d’événements récents du payload domaine, alertes critiques du domaine — **pas** de workflow métier embarqué.

---

## 9. Validation — responsive

- Grilles : `sm:grid-cols-2`, `xl:grid-cols-3`, sections graphiques `lg:grid-cols-2`, alertes / activité en `lg:grid-cols-2`.
- Cartes et graphiques enveloppés dans `min-w-0` + `ResponsiveContainer` Recharts pour limiter les débordements.

---

## 10. Validation — mobile

- Header en colonne puis `lg:flex-row` ; KPI en pile sur petit écran ; actions rapides en grille 2 puis 3–5 colonnes sur large écran.
- Aucun test navigateur automatisé exécuté dans ce rapport : validation **code + revue structurelle** uniquement.

---

## 11. Validation — performance

- `getSuperAdminCockpitPayload` accepte `{ kpis }` pour **éviter un second appel** à `getDashboardKpis` quand la page dashboard a déjà chargé les KPI.
- `SalesChart` reste en `dynamic(..., { ssr: false })` comme le dashboard standard.
- Risque résiduel : le snapshot exécutif reste une agrégation serveur coûteuse (déjà le cas sur l’API executive) — à surveiller sous charge.

---

## 12. Validation — factorisation des composants

- `CockpitMetricCard` — cartes KPI homogènes.
- `cockpit-helpers.ts` — tendances, sparkline, lecture des stats domaine, badges de santé.
- `DomainMixChart` / `PlatformTrendLine` — conteneurs graphiques isolés.
- `SuperAdminCockpitClient` — orchestration des sections.

---

## 13. Problèmes résolus

- Homepage `super_admin` confondue avec documentation / gouvernance textuelle.
- Duplication potentielle des requêtes KPI (cockpit + page) — corrigée par l’option `{ kpis }`.
- Incohérence TypeScript sur le `Tooltip` Recharts (`DomainMixChart`) — corrigée via contenu personnalisé.

---

## 14. Risques restants

- **Formation / marketing** : indicateurs détaillés absents tant que les domaines du snapshot exécutif restent en `placeholder` — l’UI affiche **N/D** plutôt que des chiffres inventés.
- **RLS Supabase** : si les politiques limitent `governance_alerts` ou `approval_requests`, les sections correspondantes seront vides ou à zéro sans signal d’erreur utilisateur fin (seulement baisse de données).
- **Heuristique anti-doublon** des alertes : basée sur des motifs dans les titres — peut laisser passer un doublon rare ou en masquer un pertinent si titres atypiques.
- **Pas de tests E2E** ajoutés pour ce flux dans cette livraison.

---

## 15. Confirmation officielle (bornée, honnête)

Pour le périmètre code livré dans cette phase :

- La homepage **`super_admin`** sur `/dashboard` est **rebranchée** comme **cockpit de supervision** (KPI, graphiques, alertes, activité, cartes départements, actions gouvernance), avec **données réelles** là où les tables / snapshots existent, et **N/D** explicite lorsque l’agrégation domaine n’est pas encore câblée.
- La solution est **structurée pour la production** (typage strict, factorisation, pas d’hydratation forcée sur le graphique 7 j. principal), sous réserve des risques listés en section 14.

Ce rapport **ne** certifie **pas** : couverture QA manuelle exhaustive, performance sous trafic réel, ni exhaustivité métier de tous les KPI imaginables sans tables sources.
