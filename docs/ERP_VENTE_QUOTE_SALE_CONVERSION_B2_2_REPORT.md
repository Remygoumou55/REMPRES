# ERP VENTE — Conversion devis → vente (B2.2)

**Phase :** B2.2 — Quote→Sale orchestration  
**Statut :** Livré (runtime + SQL + UI minimale)  
**Prérequis :** B2.0 (gouvernance), B2.1 (CRM write), fondation B1.4/B1.5 verrouillée  

---

## Objectif

Implémenter la conversion transactionnelle **devis accepté → vente** conforme au plan `OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN` :

1. Valider `crm_quotes.status = accepted` (pas déjà converti)
2. Créer la vente via `create_sale_transaction` (lignes issues de `crm_quote_lines`)
3. Lier `crm_quotes.sale_id` ↔ `sales.crm_quote_id` (+ `sales.crm_opportunity_id` si opportunité)
4. Passer le devis en `converted`
5. Échec = rollback transactionnel (une fonction PL/pgSQL)

---

## Livrables

| Artefact | Rôle |
|----------|------|
| `supabase/sql/051_crm_quote_convert_sale_orchestration.sql` | RPC `convert_crm_quote_to_sale` |
| `modules/crm/server/services/quote-sale-conversion.ts` | `convertCrmQuoteToSale` + audit + validation FK |
| `modules/crm/server/actions/crm-actions.ts` | `convertCrmQuoteToSaleAction` |
| `modules/crm/components/workflows/CrmQuoteConvertButton.tsx` | Bouton « → Vente » si `accepted` |
| `lib/vente/runtime/crm-write-governance.ts` | `QUOTE_CONVERT_SALE` **enabled: true** |
| `tests/unit/b2-2-quote-sale-conversion.test.ts` | Contrats structurels |

---

## Règles métier

- **Statut entrée :** `accepted` uniquement ; `sale_id` doit être null.
- **Lignes :** chaque ligne doit avoir `product_id` (stock) — sinon `QUOTE_LINE_NO_PRODUCT`.
- **Quantité :** `round(quantity)` avec minimum 1 pour la vente.
- **Paiement :** `cash` par défaut ; RPC accepte `cash`, `mobile_money`, `bank_transfer` (aligné `create_sale_transaction`).
- **Statut sortie devis :** `converted` (transition manuelle `converted` via `updateCrmQuoteStatus` reste interdite — B2.1).
- **Post-check :** `assertQuoteSaleOrchestrationReady` (FK bidirectionnelles + `lifecycle_status` validated).

---

## Déploiement

Appliquer la migration SQL sur l’instance Supabase :

```bash
# Exécuter 051_crm_quote_convert_sale_orchestration.sql via votre pipeline migrations habituel
```

Sans cette RPC, l’action serveur échouera côté `supabase.rpc`.

---

## Hors périmètre B2.2

- Approval manager pour montants élevés (`requiresApproval: true` au registre — pas de blocage applicatif supplémentaire)
- Lignes devis sans produit (description seule) — erreur explicite
- Cockpit KPI live (B2.3)
- SEC-1 SQL (`user_has_crm_module_permission`)

---

## Suite recommandée

- **B2.3** — Cockpit `/vente/dashboard` + KPI live  
- UX — lien cliquable devis → `/vente/historique/[saleId]`  
- Devis : saisie lignes avec `product_id` obligatoire avant envoi client  
