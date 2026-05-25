/**
 * Supply domain maturity matrix registry — Bloc 3 Étape 4.
 */
export const LOGISTICS_DOMAIN_MATURITY_VERSION = "logistics-domain-maturity-bloc3-v1" as const;

export const LOGISTICS_DOMAIN_MATURITY_MATRIX = [
  { area: "suppliers", expected: "create + governance", result: "active" as const },
  { area: "procurement", expected: "PO submit + approval row", result: "active" as const },
  { area: "purchaseOrders", expected: "create approve workflow", result: "active" as const },
  { area: "inventory", expected: "balances + receipts", result: "active" as const },
  { area: "movements", expected: "adjust + transfer", result: "active" as const },
  { area: "events", expected: "8 supply.* active", result: "active" as const },
  { area: "cockpit", expected: "buildDeptLogistiqueKpiPayload", result: "active" as const },
] as const;
