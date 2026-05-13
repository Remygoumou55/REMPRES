# Phase 4.9 — Rapport de verrouillage data ERP (honesty lock)

**Date de rédaction :** 2026-05-13  
**Statut :** rapport d’état **strict** — ce document distingue explicitement ce qui est **implémenté dans le dépôt** de ce que le brief Phase 4.9 **exige encore** sur le plan produit / QA.

---

## 1. Filtres propagés (constat)

**Dans cette passe :**

- `FilterPanelShell` appliqué au bloc filtres **GET** de `app/(app)/admin/activity-logs/page.tsx` (alignement shell + suppression de l’en-tête dupliqué).
- `FilterPanelShell` appliqué au bandeau **période / catégorie** de `app/(app)/finance/depenses/DepensesClient.tsx` (titre métier « Période & catégorie »).

**Hors périmètre immédiat (non traité dans cette passe) :** propagation exhaustive sur RH, CRM, Logistique, Formation, Consultation, Marketing, historiques secondaires, etc. Le brief cible un **verrou global** ; le code reflète encore une **propagation progressive** héritée des phases 4 / 4.5 / 4.75.

---

## 2. Search UX verrouillés (constat)

**Dans cette passe :**

- Constante **`GLOBAL_LIST_SEARCH_DEBOUNCE_MS`** ajoutée dans `lib/data-listing.ts` et utilisée comme défaut dans `lib/hooks/use-global-search.ts` pour centraliser le debounce de la recherche inline client-side.

**Déjà en place (phases antérieures, non re-listés exhaustivement ici) :** `ListSearchToolbar`, patterns vente/clients, archives admin, etc. selon rapports Phase 4 / 4.5 / 4.75.

**Écart brief :** pas d’audit fichier-par-fichier de **toutes** les barres de recherche pour éliminer tout résidu « legacy ».

---

## 3. Exports finalisés (constat)

**Non verrouillé globalement dans cette passe.** Les liens d’export existants (ex. activity logs CSV / JSON) n’ont pas été refactorisés vers un module d’export unique.

**Risque résiduel :** divergences UX / confirmations / guards entre modules.

---

## 4. Bulk systems verrouillés (constat)

**Non traité dans cette passe.** Aucune harmonisation transversale des sélections, confirmations, ni batch RPC.

---

## 5. Realtime verrouillés (constat)

**Non traité dans cette passe.** Pas de revue des subscriptions, déduplication, ni stratégie refresh unifiée.

---

## 6. React Query industrialisés (constat)

**Non traité dans cette passe.** Pas de modification des query keys, `staleTime`, invalidation centralisée, ni audit anti-duplication.

---

## 7. Data states verrouillés (constat)

**Non traité dans cette passe.** Les états vides / retry / sync restent tels qu’implémentés module par module.

---

## 8. Modules secondaires finalisés (constat)

**Partiel.** Les phases précédentes ont couvert de nombreuses pages admin / finance / vente / archives ; cette passe ne clôt pas l’ensemble des « secondaires » listés dans le brief.

---

## 9. Responsive data validés (constat)

**Non exécuté.** Aucune validation manuelle ou automatisée sur la matrice desktop → mobile small.

---

## 10. Performances optimisées (constat)

**Hors scope de cette passe** (pas de profiling, pas de changement de stratégie cache au-delà du debounce search par défaut).

---

## 11. Validation gouvernance data par rôle (constat)

**Non exécutée dans cette passe.** La matrice de visibilité n’a pas été re-auditée fichier par fichier.

---

## 12. Validation stabilité realtime (constat)

**Non réalisée** (pas de tests de charge ni de scénarios multi-onglets).

---

## 13. Validation stabilité React Query (constat)

**Non réalisée.**

---

## 14. Validation responsive data UX (constat)

**Non réalisée** (cf. §9).

---

## 15. Validation cohérence enterprise data (constat)

**Partielle par construction :** cohérence accrue sur les zones touchées (filtres activity logs, filtres dépenses, debounce search global) ; **pas** de passe globale exhaustive.

---

## 16. Validation performance & safety (constat)

**Principe respecté :** changements limités (shell UI + constante + hook) pour limiter les régressions cache / permissions / Supabase.

**Non garanti :** absence totale de régression sans exécution CI locale complète au moment de la fusion.

---

## 17. Conformité design system (constat)

Les modifications utilisent **`FilterPanelShell`** (shell officiel filtres) et **`lib/data-listing`** pour le debounce search, en ligne avec les fondations Phase 4.x.

---

## 18. Problèmes résolus (cette passe)

- **Duplication visuelle** de l’en-tête « Filtres » sur la page journal d’activité (délégué au shell).
- **Bandeau filtres dépenses** non aligné sur le shell entreprise.
- **Debounce recherche inline** codé en dur dans `useGlobalSearch` — désormais référencé depuis une constante exportée partagée.

---

## 19. Risques restants (honnêtes)

1. **Périmètre brief vs temps réel :** le cahier Phase 4.9 décrit un **verrouillage total** multi-phases produit ; le dépôt peut encore contenir des patterns hérités hors des zones auditées.
2. **Exports / bulk / realtime / RQ :** principales zones de dette UX & technique si non industrialisées dans des passes dédiées.
3. **Responsive & rôles :** risque UX et conformité sans QA matricielle explicite.

---

## 20. Confirmation officielle (obligatoire, honnête)

**Il n’est pas factuellement exact d’affirmer :** « plus aucun cleanup data ERP restant » ni « lockdown data total achevé » au sens du brief Phase 4.9.

**Affirmation alignée sur la réalité du dépôt :**

- Les **fondations** (TableShell, pagination, filtres shell, search foundations, phases 4–4.75) restent la base.
- La **Phase 4.9 (cette passe)** renforce un **sous-ensemble** : filtres admin/finance ciblés + **centralisation du debounce** de recherche liste.
- Un **verrouillage production enterprise complet** au sens des 12 sous-phases du brief exige des **itérations supplémentaires** (exports, bulk, realtime, RQ, états, QA responsive, gouvernance), documentées et testées.

---

*Fin du rapport Phase 4.9 — version factuelle.*
