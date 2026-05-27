# 09 — Deduplication Report

## Duplications critiques

### Approvals (priorité haute)

- 2+ migrations créent `approval_requests`
- 2 UIs: `/actions/approbations` vs `/admin/approvals`
- **Cible**: une UI, un service write path

### Logistique commandes (priorité haute)

- `simple_purchase_orders` vs `purchase_orders` vs `logistics_purchase_orders`
- **Cible**: `purchase_orders` pour supply opérationnel, enterprise en lecture seule

### Stock (documenté, pas fusionné)

- `stock_items` (supply) ≠ `logistics_inventory_balances` (enterprise multi-site)
- Documenté `080_unify_duplicate_tables.sql` — **ne pas fusionner**

### CRM vs Marketing leads

- `crm_leads` vs `leads` — domaines distincts, pas duplication

### Platform APIs

- Schéma `067` (`api_key` PK) vs CRUD récent (`id`, `name`, `status`)
- **Cible**: migration réconciliation `093_platform_reconcile.sql`

## Governance layer unifiée (lot 1)

- `mutation-guard.ts` évite duplication checks auth par action

## Plan déduplication

| Sprint | Action |
|--------|--------|
| S1 | Approvals UI unique |
| S2 | Platform schema reconcile |
| S3 | Logistique PO: déprécier simple si commandes stable |
