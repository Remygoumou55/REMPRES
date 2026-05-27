# 06 — Inventory Safety Report

## Source de vérité stock (supply)

- Table: `stock_items`
- Mouvements: `stock_movements_logistique`
- Trigger: `trg_stock_mov_log_apply` (070) — met à jour `quantity` sur INSERT

## Bug critique corrigé (lot 1)

**Double comptage à réception commande**

- Fichier: `lib/server/purchase-orders.ts` — `receivePurchaseOrder`
- Cause: INSERT mouvement + UPDATE manuel quantity
- Fix: conserver uniquement INSERT mouvement (trigger applique quantity)

## Flux commandes (duplication à gérer)

| Flux | Table | Page |
|------|-------|------|
| Simple achats | `simple_purchase_orders` | `/logistique/achats` |
| Commandes fournisseurs | `purchase_orders` | `/logistique/commandes` |
| Enterprise | `logistics_purchase_orders` | enterprise |

## Inventory Runtime Protection Layer (cible)

- [x] Anti double apply quantity (lot 1)
- [ ] Transaction RPC `receive_po_and_stock`
- [ ] Validation `quantity >= 0` server-side
- [ ] Lock optimiste sur `stock_items.version`

## Alertes stock

- Trigger `088_low_stock_trigger.sql` — type notification à normaliser (`approval_rejected` → type warning dédié)
