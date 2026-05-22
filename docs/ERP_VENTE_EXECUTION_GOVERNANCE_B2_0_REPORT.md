# REMPRES ERP — Phase B2.0
# Sales Execution Governance — Runtime Governance Lock

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** gouvernance d’exécution runtime + **implémentation P0 ciblée** (pas CRM build, pas SQL, pas redesign UX)  
**Prérequis :** M1→M3.75 · **B1.1→B1.6** (foundation LOCKED)  
**Livrable code :** `lib/vente/runtime/*` · tests `tests/unit/b2-0-vente-runtime-governance.test.ts`

---

## Synthèse exécutive

| Question | Réponse |
|----------|---------|
| **B2.0 a-t-il « build » le CRM ?** | **Non** — registre write désactivé, pas de server actions CRM |
| **XL-1 (KPI triple) résolu ?** | **Oui (commerce)** — `getVenteCommerceKpis` = source unique ; dept API + `getDashboardKpis` délégués |
| **SEC-1 résolu ?** | **Partiel** — garde **applicative** `assertCrmRuntimeReadAccess` ; SQL 049 inchangé (hors scope) |
| **Lifecycle aligné ?** | **Oui (commerce runtime)** — filtres `lifecycle_status = validated` pour KPI / listes opérationnelles |
| **Orchestration devis→vente ?** | **Contrat verrouillé** — `quote-sale-orchestration.ts` ; implémentation = **B2.2** |
| **Verdict** | **RUNTIME GOVERNANCE LOCKED** · **PARTIALLY READY** pour B2.1 CRM write |

---

# 1. Runtime audit (Phase 1)

## 1.1 État avant B2.0

| Zone | Runtime observé | Problème |
|------|-----------------|----------|
| KPI commerce | 3 chemins (`getDashboardKpis`, `/api/dept/vente/kpis`, placeholder cockpit) | Filtres divergents (`deleted_at` vs brut vs net) |
| KPI CRM | `getCrmOperationalOverview` sans garde dept | SEC-1 |
| Mutations CRM | Repositories **read-only** | Pas de write path |
| Mutations Commerce | RPC + TS actifs | Lifecycle partiellement sur `deleted_at` |
| Approvals CRM | Colonnes + constantes | Non branchées |

## 1.2 État après B2.0 (implémentation)

| Artefact | Rôle |
|----------|------|
| `lib/vente/runtime/sales-lifecycle.ts` | Constantes + helpers lifecycle |
| `lib/vente/runtime/sale-kpi-aggregates.ts` | Règle net CA unique |
| `lib/vente/runtime/vente-commerce-kpis.ts` | **SoT commerce** `vente-commerce-runtime-v1` |
| `lib/vente/runtime/vente-kpi-runtime.ts` | `buildDeptVenteKpiPayload`, bundle optionnel |
| `lib/vente/runtime/vente-runtime-security.ts` | SEC-1 lecture/écriture CRM (app) |
| `lib/vente/runtime/crm-write-governance.ts` | Registre mutations CRM (toutes `enabled: false`) |
| `lib/vente/runtime/quote-sale-orchestration.ts` | Contrat conversion devis→vente |

## 1.3 Consommateurs realignés

| Consommateur | Avant | Après B2.0 |
|--------------|-------|------------|
| `getDashboardKpis` | Requêtes sales + `deleted_at` | Délègue `getVenteCommerceKpis` |
| `/api/dept/vente/kpis` | Agrégation inline brute | `buildDeptVenteKpiPayload` |
| `getCrmOperationalOverview` | Opps toutes non deleted | Stages ouverts + `source` metadata |
| `/vente/crm`, `/vente/crm/analytics` | Overview sans garde | `getCrmOperationalOverviewGuarded` |
| `listSales` | `deleted_at` + `neq archived` | `lifecycle_status = validated` |
| `updatePaymentStatus` | `deleted_at` fetch | `lifecycle_status = validated` |

**Non modifié (volontaire) :** `DepartmentCockpitPlaceholder` (cockpit data = B2.3) · pages CRM listes (B2.1).

---

# 2. KPI governance lock (Phase 2 — XL-1)

## 2.1 Règle officielle B2.0

| KPI domaine | 1 source | 1 payload | Identifiant |
|-------------|----------|-----------|-------------|
| **Commerce** (clients, produits, ventes, stock, 7j) | `getVenteCommerceKpis` | `VenteCommerceKpis` | `vente-commerce-runtime-v1` |
| **CRM** (leads, opps, devis, activités, pipeline) | `getCrmOperationalOverview` | `CrmOperationalOverview` | `crm-operational-runtime-v1` |
| **Supervision dept** | Dérivé commerce uniquement | `DeptKpiPayload` via `buildDeptVenteKpiPayload` | metadata.source = commerce source |

## 2.2 Interdictions maintenues

| Surface | Règle |
|---------|-------|
| Cockpit `/vente/dashboard` | **Interdit** brancher `getDashboardKpis` ou dept API directement — **B2.3** utilisera `getVenteCommerceKpis` + CRM slice |
| Hub CRM | CRM KPI **seulement** via `getCrmOperationalOverviewGuarded` — pas de duplication commerce dans hub sans bundle explicite |
| `getDashboardKpis` | **Legacy SA/global** — commerce ventes aligné lifecycle ; **pas** SoT cockpit manager |

## 2.3 Définition CA (verrouillée)

- Filtre ventes : `lifecycle_status = validated`.
- Net = Σ `total_amount_gnf` − lignes `payment_status = cancelled`.
- **Interdit** : somme brute sans règle net pour cockpit / dept vente.

**KPI lock : CONFIRMED (commerce)** · **CRM slice lock : CONFIRMED (source tag)**

---

# 3. Security governance lock (Phase 3 — SEC-1)

## 3.1 Garde applicative (M2)

`assertCrmRuntimeReadAccess(userId)` :

| Cas | Autorisé |
|-----|----------|
| `super_admin` | Oui (supervision) |
| Console admin (`isAdminRole`) | Oui (supervision) |
| Autre | `crm`/`vente` read **ET** `department_key = VENTE` |

`assertCrmRuntimeWriteAccess(userId, action)` :

| Cas | Autorisé |
|-----|----------|
| Supervision (SA/admin) | **Non** — mutations opérationnelles interdites |
| Dept ≠ VENTE | **Non** |
| Permission CRM manquante | **Non** |
| Registre action `enabled: false` | **Non** (B2.0) |

## 3.2 Limite honnête

- **SQL** `user_has_crm_module_permission` : **inchangé** (pas de migration B2.0).
- SEC-1 **complet** = couche app **+** future migration SQL dept guard.

**Security lock : CONFIRMED (app layer)** · **SQL SEC-1 : OPEN (P1)**

---

# 4. Sales lifecycle execution lock (Phase 4)

## 4.1 Règle runtime unique (commerce)

| Usage | Filtre officiel |
|-------|---------------|
| KPI / agrégats CA | `lifecycle_status = validated` |
| Liste opérationnelle (`listSales`) | `validated` |
| Mutation paiement | `validated` uniquement |
| Lecture détail (`getSaleById`) | `validated` **ou** `cancelled` (historique) |
| Archivage | RPC `archive_and_soft_delete_sale` → `archived` |

## 4.2 `deleted_at` sur `sales`

- **Obsolète** pour KPI et listes opérationnelles (B1.4).
- Historique page : encore `deleted_at` — **dette P2** (aligner requête historique).

**Lifecycle lock : CONFIRMED (commerce paths touched)**

---

# 5. CRM write path governance (Phase 5)

## 5.1 Porte unique future

Toute mutation CRM **doit** passer par :

```typescript
assertCrmWriteActionAllowed(userId, CRM_WRITE_ACTIONS.<action>, permission)
```

## 5.2 Registre (B2.0 — tout désactivé)

| Action | Enabled | Approval |
|--------|---------|----------|
| `crm.lead.*` | false | — |
| `crm.opportunity.*` | false | — |
| `crm.quote.*` | false | — |
| `crm.quote.convert_sale` | false | **true** (futur) |
| `crm.activity.*` | false | — |

**Write path lock : CONFIRMED** — implémentation **B2.1+** uniquement.

---

# 6. Quote → Sale orchestration lock (Phase 6)

## 6.1 Plan officiel (`OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN`)

1. `validate_quote_accepted_or_converted`
2. `create_or_link_sale`
3. `set_crm_quotes_sale_id`
4. `set_sales_crm_quote_id`
5. `set_crm_quotes_status_converted`

`rollbackOnFailure: true`

## 6.2 Validation FK (`validateQuoteSaleLinkConsistency`)

- Devis `converted` ⇒ `sale_id` cohérent des deux côtés.
- Vente cible en `lifecycle_status = validated`.

**Orchestration lock : CONFIRMED (contract)** · **Build : B2.2**

---

# 7. Execution compatibility (Phase 7)

| Couche B1 | Compatible B2.0 ? | Note |
|-----------|-------------------|------|
| B1.1 Domain | **Oui** | Runtime sous `/vente`, CRM guarded |
| B1.2 Navigation | **Oui** | Aucun changement rail |
| B1.3 Cockpit | **Oui** | Prêt à consommer `getVenteCommerceKpis` en B2.3 |
| B1.4 Data | **Oui** | SoT commerce unifié ; CRM source taggée |
| B1.5 Workflow | **Oui** | Write registry + orchestration contract |
| B1.6 Foundation | **Oui** | P0 XL-1/SEC/lifecycle adressés en partie |

**Aucune contradiction** entre B1 et B2.0 introduite.

---

# 8. B2 build readiness (Phase 8)

| Build | Readiness post-B2.0 | Bloquant restant |
|-------|---------------------|------------------|
| **B2.0** (governance) | **Done** | — |
| **B2.1 CRM write** | **Partiel** | Activer registre + state machine |
| **B2.2 Quote→Sale** | **Partiel** | RPC/transaction + plan steps |
| **B2.3 Cockpit live** | **Partiel** | Brancher placeholder → `getVenteCommerceKpis` |
| **Pipeline UI mutations** | **Bloqué** | B2.1 |
| **Automation** | **Bloqué** | B2.4 |
| **POS** | **Prêt** | Maintenance seulement |

---

# 9. Execution risk matrix (Phase 9)

| ID | Risque | Prob. | Impact | Mitigation |
|----|--------|-------|--------|------------|
| E-R1 | Bypass KPI sans `getVenteCommerceKpis` | Moyenne | Haute | PR checklist B2.0 |
| E-R2 | SEC-1 contourné via SQL direct | Faible | Haute | Migration SQL P1 |
| E-R3 | CRM write hors `assertCrmWriteActionAllowed` | Moyenne | Critique | Code review B2.1 |
| E-R4 | Conversion devis sans transaction | Haute | Critique | B2.2 strict |
| E-R5 | Historique `deleted_at` vs lifecycle | Moyenne | Moyenne | Aligner page historique |
| E-R6 | Hub CRM sans guarded sur nouvelles pages | Moyenne | Moyenne | Template guarded |

---

# 10. Dette restante

| P | Item | Phase |
|---|------|-------|
| P0 | Brancher cockpit `/vente/dashboard` | B2.3 |
| P0 | CRM write enable + state machine | B2.1 |
| P1 | SQL SEC-1 dept guard sur `crm_*` | Gouvernance SQL |
| P1 | Historique ventes : requête lifecycle | B2.x |
| P2 | Job devis expirés | B2.4 |
| P2 | Retirer `CrmOperationalNav` duplicate | UX |

---

# 11. Legacy restant

- `getDashboardKpis` : reste point d’entrée **global SA** (commerce aligné, pas supprimé).
- `getCrmOperationalOverview` : encore appelable sans garde — **réservé usage interne** ; pages publiques → guarded.
- Placeholder cockpit inchangé.

---

# 12. Incohérences runtime (liste complète)

| # | Incohérence | Statut post-B2.0 |
|---|-------------|------------------|
| RT-1 | KPI dept brut vs net | **CLOSED** |
| RT-2 | KPI dashboard `deleted_at` | **CLOSED** |
| RT-3 | Opps ouvertes sur-comptées | **CLOSED** |
| RT-4 | CRM sans dept guard | **PARTIAL** (app only) |
| RT-5 | Cockpit sans data | **OPEN** B2.3 |
| RT-6 | CRM write absent | **OPEN** B2.1 (governed) |
| RT-7 | Conversion devis | **OPEN** B2.2 (contract ready) |
| RT-8 | Historique `deleted_at` | **OPEN** |

---

# 13. Risques runtime futurs

| # | Risque |
|---|--------|
| 1 | Nouvelle route KPI contournant `lib/vente/runtime` |
| 2 | Import direct `getCrmOperationalOverview` depuis UI sans guarded |
| 3 | Activation write CRM sans registre |
| 4 | Double transaction conversion + POS parallèle |

---

# 14. Problèmes ouverts

| # | Problème | Owner |
|---|----------|-------|
| O-1 | SQL SEC-1 | Migration |
| O-2 | Cockpit placeholder | B2.3 |
| O-3 | CRM mutations | B2.1 |
| O-4 | Devis→vente transaction | B2.2 |

---

# 15. Verdict final

## 15.1 Déclaration B2.0

# SALES EXECUTION RUNTIME — **GOVERNANCE LOCKED**

Tout build **CRM write · pipeline · cockpit live · devis runtime · automation** doit **OBEY** :

1. `lib/vente/runtime/*` (SoT, security, lifecycle, write registry, orchestration).  
2. Fondation **B1.1→B1.6** (inchangée).  
3. Checklist PR Annexe A.

## 15.2 Grille verdict

| Critère | Statut |
|---------|--------|
| Gouvernée | **Oui** |
| Sécurisée | **Partiel** (app SEC-1) |
| Cohérente | **Oui** (commerce KPI + lifecycle) |
| Non hybride (commerce KPI) | **Oui** |
| Non hybride (cockpit UI) | **Non** — jusqu’à B2.3 |
| Prête pour B2 build CRM | **Partiel** — **B2.1 autorisé** avec registre |

## 15.3 Contrôles techniques

| Contrôle | Résultat |
|----------|----------|
| `npx tsc --noEmit` | **OK** |
| `npm test` | **86/86 OK** (dont 9 tests B2.0) |
| Fichiers B1.x modifiés | **0** |
| SQL migrations | **0** |

---

## Annexe A — Checklist PR post-B2.0

- [ ] KPI commerce via `getVenteCommerceKpis` ou `buildDeptVenteKpiPayload`
- [ ] Pas de requête sales KPI sur `deleted_at`
- [ ] CRM pages : `getCrmOperationalOverviewGuarded(userId)`
- [ ] Mutations CRM : `assertCrmWriteActionAllowed` uniquement
- [ ] Conversion devis : `validateQuoteSaleLinkConsistency` avant write
- [ ] Tests unitaires passent

## Annexe B — Carte des sources runtime

```
Commerce KPI  → getVenteCommerceKpis     → vente-commerce-runtime-v1
Dept vente    → buildDeptVenteKpiPayload → (dérivé commerce)
SA dashboard  → getDashboardKpis         → (délègue commerce)
CRM KPI       → getCrmOperationalOverviewGuarded → crm-operational-runtime-v1
Cockpit B2.3  → (à brancher) getVenteCommerceKpis + CRM slice
```

---

*Phase B2.0 — gouvernance d’exécution verrouillée. Prochaine étape recommandée : **B2.1** (CRM write path + activation registre sélectif).*
