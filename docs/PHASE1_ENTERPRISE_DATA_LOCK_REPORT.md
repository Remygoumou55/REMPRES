# Phase 1 — Enterprise Data Lock — rapport final (1.10)

**Date :** 2026-05-13  
**Statut :** **strict / honnête** — ce document distingue livrables code **réels** de l’ambition **globale** du brief (tous modules, toutes surfaces).

---

## 1. Exports finalisés (constat)

**Renforcé dans cette passe :**

- **Finance — export modal (POST)** : `FinanceDashboardClient` utilise désormais `useToast` pour **succès** et **erreurs** (réponse HTTP non OK + corps texte si présent, erreur réseau). Plus de silence sur échec.
- **`FinanceExportModal`** : message **« Préparation du fichier… »** pendant `busy`, `aria-busy` sur le panneau modal.

**Inchangé / hors harmonisation globale :**

- Liens **GET** export (ex. `/api/finance/export?format=csv`, exports **activity logs** CSV/JSON) : pas refactorisés vers un composant unique ; permissions côté route inchangées.

**Écart brief 1.1 :** pas d’industrialisation **RH / CRM / Vente / …** exports dans cette passe.

---

## 2. Bulk systems verrouillés (constat)

**Inchangé dans cette passe.** Les barres existantes (`BulkDeleteActionBar`, archives admin, etc.) restent telles quelles — pas de nouvelle couche commune ni audit mobile systématique.

---

## 3. Realtime verrouillés (constat)

**Inchangé dans cette passe** (subscriptions, conflits, dédup non modifiés).

---

## 4. React Query industrialisés (constat)

**Livrables code :**

- **`lib/react-query-erp-policy.ts`** : source unique **`ERP_QUERY_POLICY`** (staleTime défaut 5 min, retry 1, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`) + export **`ERP_QUERY_DEFAULT_STALE_MS`**.
- **`lib/queryClient.ts`** : consomme **`ERP_QUERY_POLICY`** (alignement défauts client global).
- **`hooks/useSectionDashboard.ts`** : supprime **`refetchOnWindowFocus: true`** → aligné politique ERP (réduit flicker au retour onglet).
- **`modules/executive-dashboard/hooks/use-executive-global-snapshot.ts`** : idem + **`retry`** / **`refetchOnReconnect`** explicites.
- **Snapshots visuels département** (`use-finance-visual-snapshot`, `use-hr-visual-snapshot`, `use-crm-visual-snapshot`, `use-logistics-visual-snapshot`) : **`refetchOnWindowFocus` / `refetchOnReconnect` / `retry`** alignés sur **`ERP_QUERY_POLICY`**.

**Déjà en place (non exhaustif) :** `lib/query/query-keys.ts` pour clés centralisées par domaine.

**Écart brief 1.4 :** pas d’audit exhaustif de **toutes** les mutations / invalidations / optimistic updates.

---

## 5. Data states verrouillés (constat)

**Inchangé globalement** dans cette passe (hors feedback toast export finance).

---

## 6. Responsive data validés (constat)

**Non exécuté** (pas de matrice breakpoints / devices).

---

## 7. Validation gouvernance data par rôle (constat)

**Non réalisée** dans cette passe.

---

## 8. Validation stabilité realtime (constat)

**Non réalisée.**

---

## 9. Validation stabilité React Query (constat)

**Partielle :** cohérence politique **focus/reconnect/retry** sur hooks listés §4 ; pas de tests de charge ni scénarios multi-onglets formalisés.

---

## 10. Validation responsive data UX (constat)

**Non réalisée** (cf. §6).

---

## 11. Validation cohérence enterprise data (constat)

**Progression :** filtres finance dashboard alignés **`FilterPanelShell`** (« Période & filtres ») + export finance plus **explicite** pour l’utilisateur + politique RQ **documentée en code** et appliquée aux points chauds identifiés.

**Limite :** le brief « cohérence globale » sur tous modules n’est **pas** clos.

---

## 12. Validation performance & safety (constat)

**Changements à faible risque** : politique RQ (moins de refetch au focus), toasts export, UI shell filtres finance.  
**À surveiller :** moins de refresh automatique au focus fenêtre sur sections dashboard — **données légèrement moins « fraîches »** au simple retour d’onglet (échange assumé contre stabilité UX).

---

## 13. Conformité design system (constat)

**`FilterPanelShell`** sur le formulaire filtres **`FinanceDashboardClient`** ; modal export conserve le style existant avec accessibilité **`aria-busy`**.

---

## 14. Problèmes résolus (cette passe)

1. Export finance modal **sans feedback** utilisateur en cas d’échec.  
2. **`refetchOnWindowFocus: true`** sur hooks dashboard **en contradiction** avec `makeQueryClient`.  
3. Absence de **fichier politique** partagé pour options RQ ERP.  
4. Filtres page Finance **hors shell** filtres entreprise.

---

## 15. Risques restants (honnêtes)

1. **Exports** encore hétérogènes (GET vs POST, pas de composant unique).  
2. **Bulk / realtime / états / responsive** non couverts.  
3. **Dette validation** : pas de preuve automatisée « production-ready » sur l’ensemble du brief.

---

## 16. Confirmation officielle (obligatoire)

**Il est factuellement incorrect d’affirmer :** « Plus aucun cleanup data ERP restant » ou « couche data ERP totalement verrouillée » au sens du brief Phase 1.1–1.9.

**Affirmation alignée sur le dépôt :** cette passe **renforce** des briques **exports (finance modal)**, **filtres (finance)**, et **React Query (politique partagée + hooks alignés)**. Le verrouillage **global** multi-modules reste un **programme** à poursuivre hors de cette itération.

---

*Voir aussi `docs/FINAL_ENTERPRISE_DATA_LOCK_REPORT.md` et `docs/PHASE4_9_LOCK_REPORT.md` pour le fil historique filtres/recherche.*
