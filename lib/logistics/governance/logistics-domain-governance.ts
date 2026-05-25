/**
 * Supply domain governance — Bloc 3 Étape 4.
 */
export const LOGISTICS_DOMAIN_GOVERNANCE_VERSION = "logistics-domain-governance-bloc3-v1" as const;

export const LOGISTICS_DOMAIN_GOVERNANCE = {
  version: LOGISTICS_DOMAIN_GOVERNANCE_VERSION,
  departmentKey: "LOGISTIQUE",
  moduleKey: "logistics",
  inventorySoT: "logistics_inventory_balances",
  movementSoT: "logistics_stock_movements",
  eventOwner: "logistics",
} as const;

export const LOGISTICS_CAPABILITY_STATUS = {
  supplierGovernance: "active",
  procurement: "active",
  purchaseOrders: "active",
  inventory: "active",
  movements: "active",
  events: "active",
  saleStockBridge: "planned",
} as const;
