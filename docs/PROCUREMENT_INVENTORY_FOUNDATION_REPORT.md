# PROCUREMENT + INVENTORY FOUNDATION — Bloc 3 Étape 4

**Date :** 22 mai 2026  
**Verdict :** `ACTIVE`

**Super Admin :** zone gelée — inchangé.

---

## 1. Contexte

Post-CRM ACTIVE. Mission : domaine Supply (logistique) opérationnel — procurement, inventory, movements, events.

---

## 2. Suppliers

| Capability | Implémentation |
|------------|----------------|
| Create | `createLogisticsSupplier` + `supply.supplier.created` |
| Suspend | `updateLogisticsSupplierActive` |

→ [`docs/supply-audit/SUPPLIER_REPORT.md`](supply-audit/SUPPLIER_REPORT.md)

---

## 3. Procurement

Soumission PO → `approval_requests` + `supply.purchase.requested`.

→ [`docs/supply-audit/PROCUREMENT_REPORT.md`](supply-audit/PROCUREMENT_REPORT.md)

---

## 4. PO

Workflow : draft → submitted → approved. UI actions sur `/logistique/achats`.

→ [`docs/supply-audit/PO_REPORT.md`](supply-audit/PO_REPORT.md)

---

## 5. Inventory

SoT : `logistics_inventory_balances`. Réceptions via `logistics_goods_receipt_lines` (triggers DB).

→ [`docs/supply-audit/INVENTORY_REPORT.md`](supply-audit/INVENTORY_REPORT.md)

---

## 6. Movement

Types : adjustment, transfer_in/out, purchase_receipt (trigger). Events bus.

→ [`docs/supply-audit/MOVEMENT_REPORT.md`](supply-audit/MOVEMENT_REPORT.md)

---

## 7. Events

Catalogue `erp-event-catalog-bloc3-supply-v1` — **55 types**, **8 supply.*** actifs.

→ [`docs/supply-audit/SUPPLY_EVENT_REPORT.md`](supply-audit/SUPPLY_EVENT_REPORT.md)

---

## 8. Cockpit

| Surface | Route |
|---------|-------|
| Hub | `/logistique` |
| Dept | `/dept/logistique` (KPI live, `placeholder: false`) |

→ [`docs/supply-audit/SUPPLY_OPERATIONS_REPORT.md`](supply-audit/SUPPLY_OPERATIONS_REPORT.md)

---

## 9. Performance

Parallel analytics + overview counts. Pas de KPI hardcodés dept.

→ [`docs/supply-audit/SUPPLY_PERFORMANCE_REPORT.md`](supply-audit/SUPPLY_PERFORMANCE_REPORT.md)

---

## 10. Matrix

`tests/unit/supply-domain-maturity-matrix.test.ts` — **11 PASS**

→ [`docs/supply-audit/SUPPLY_MATRIX_REPORT.md`](supply-audit/SUPPLY_MATRIX_REPORT.md)

---

## 11. Dette restante

| ID | Item |
|----|------|
| S1 | Bridge vente `products.stock_quantity` ↔ `logistics_inventory_balances` |
| S2 | UI réception multi-lignes PO |
| S3 | `logistics_supplier_contract` (approval type sans table) |

---

## 12. Verdict

### `ACTIVE`

lint + build PASS. Supply gouverné, traçable, event-driven, writes opérationnels.

Validation → [`docs/supply-audit/SUPPLY_VALIDATION_REPORT.md`](supply-audit/SUPPLY_VALIDATION_REPORT.md)
