# REMPRES ERP — Phase 4.75 — rapport propagation data & verrouillage (honesty lock)

**Référence :** 2026-05-13  
**Objectif brief :** propagation globale des primitives data (`TableShell`, `PaginationBar`, filtres, etc.) sur **tous** les modules.  
**Périmètre réel livré :** propagation **`TableShell`** à grande échelle sur **admin (observability, compliance, automation, AI)** + **plateforme / multitenant / ecosystem** + **Finance dépenses** + **Vente (archives clients & produits, détail vente)** + **admin archives (clients / produits)** + **gouvernance analytics (comparaison départements)**. **Aucun** changement sur exports, realtime, ni refonte globale des `queryKey` React Query.

---

## 1. Modules propagés (TableShell / cohérence liste)

| Zone | Fichiers / comportement |
|------|-------------------------|
| **Admin — observability** | `health`, `traces`, `predictive`, `incidents`, `correlations`, `anomalies` — wrapper liste → **`TableShell`**. |
| **Admin — compliance** | `sod`, `snapshots`, `risks`, `retention`, `periods`, `fiscal`, `exports`. |
| **Admin — automation** | `workflows`, `schedules`, `runs`, `events`. |
| **Admin — AI** | `recommendations`, `predictive`, `forecasting`, `assistants`. |
| **Admin — platform** | `marketplace` — tableau catalogue. |
| **Admin — multitenant** | `tenants`. |
| **Admin — ecosystem** | `partners`. |
| **Finance** | `DepensesClient` — corps de tableau (lignes filtrées) → **`TableShell`**. |
| **Vente — archives** | `vente/clients/archives`, `vente/produits/archives`. |
| **Vente — historique détail** | `vente/historique/[id]` — lignes produits (scroll) via **`TableShell`** sans double carte. |
| **Admin — archives** | `ArchivedClientsSection`, `ArchivedProductsSection`. |
| **Gouvernance** | `DepartmentComparisonTable`. |

---

## 2. Filters harmonisés

- **Inchangés** dans cette passe (pas de migration massive vers `FilterPanelShell` hors périmètres déjà couverts Phase 4.5).

---

## 3. Search UX harmonisés

- **Inchangés** globalement ; les barres **`ListSearchToolbar`** restent sur **clients / produits** (Phase 4.5).

---

## 4. Exports finalisés

- **Non modifiés**.

---

## 5. Bulk systems finalisés

- **Non modifiés** (barres bulk existantes conservées).

---

## 6. Realtime propagés

- **Non modifiés**.

---

## 7. React Query industrialisés

- **Non modifiés** (aucune nouvelle centralisation des clés).

---

## 8. Data states propagés

- **Non** : pas de nouveau composant skeleton / retry global.

---

## 9. Responsive data validés

- **Non** exécuté sur matrice device ; **`TableShell`** garantit scroll horizontal **contrôlé** là où il remplace des `overflow-x-auto` ad hoc.

---

## 10. Performances optimisées

- **Légère** homogénéisation DOM (moins de variations de wrappers) ; **pas** de mesure de perf.

---

## 11. Validation role-based data governance

- **Non re-auditée**.

---

## 12. Validation realtime stabilité

- **Inchangée**.

---

## 13. Validation React Query stabilité

- **Inchangée**.

---

## 14. Validation responsive data UX

- **Partielle** (comportement attendu du scroll dans `TableShell`).

---

## 15. Validation enterprise data consistency

- **Renforcée** pour les **listes admin stub** et **parcours archives / détail vente** (même primitive d’enveloppe).

---

## 16. Validation performance safety

- Pas de nouveau `useEffect` data ; pages **RSC** inchangées côté fetch.

---

## 17. Validation design system compliance

- **`TableShell`** : `rounded-2xl`, `border-gray-100`, `shadow-sm` — **aligné** sur le design system Phase 4 (remplace `rounded-xl border-gray-200` sur les stubs admin).

---

## 18. Problèmes résolus (synthèse)

1. **~21 pages admin** avec double style **rounded-xl / gray-200** vs shell ERP → **`TableShell`**.  
2. **Finance dépenses** : scroll tableau dupliqué dans carte → **`TableShell`** sur le bloc données.  
3. **Archives vente & admin archives** : double `div` scroll → **`TableShell`**.  
4. **Détail vente** : scroll interne → **`TableShell`** « plat » dans la carte existante.  
5. **Comparaison départements** : scroll nu → **`TableShell`**.

---

## 19. Risques restants (honesty)

- **Nombreuses** vues (RH, logistique, formation, CRM hors vente, etc.) **non** passées en revue.  
- **`clients-table` / `products-table` / `sales-table`** : corps virtualisé conserve **`overflow-x-auto`** interne (nécessaire au scroll) — **hors** `TableShell` sur le tbody pour raisons de perf ; ce n’est **pas** une incohérence fonctionnelle.  
- **Exports, realtime, RQ keys, saved filters** : **hors scope** de ce diff.  
- La phrase « plus aucun cleanup data ERP » sur **toute** la codebase : **fausse** sans audit exhaustif.

---

## 20. Confirmation officielle

**Verrouillé pour Phase 4.75 *livré en repo* :** propagation **`TableShell`** documentée section 1 + transparence sections 19–20.

**Confirmation honnête :** le brief « tous modules / tout realtime / tout RQ » **n’est pas** entièrement exécuté ; ce commit est une **vague de propagation** ciblée sur **listes & tableaux** identifiables par grep.

---

## Fichiers impactés (Synthèse)

- **21 fichiers** sous `app/(app)/admin/` (observability ×6, compliance ×7, automation ×4, ai ×4) + `platform/marketplace`, `multitenant/tenants`, `ecosystem/partners`.  
- `app/(app)/finance/depenses/DepensesClient.tsx`  
- `app/(app)/vente/clients/archives/page.tsx`  
- `app/(app)/vente/produits/archives/page.tsx`  
- `app/(app)/vente/historique/[id]/page.tsx`  
- `components/admin/archives/ArchivedClientsSection.tsx`  
- `components/admin/archives/ArchivedProductsSection.tsx`  
- `components/governance/analytics/DepartmentComparisonTable.tsx`  

*Script temporaire de patch batch supprimé après application.*
