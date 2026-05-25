/**
 * Finance domain maturity registry — Bloc 3 Étape 2.
 */
export const FINANCE_DOMAIN_MATURITY_VERSION = "finance-domain-maturity-bloc3-v1" as const;

export const FINANCE_DOMAIN_MATURITY_MATRIX = [
  { area: "transactions", expected: "FT + bus", result: "active" as const },
  { area: "governance", expected: "write registry 7 actions", result: "active" as const },
  { area: "audit", expected: "governance_audit_events", result: "active" as const },
  { area: "reporting", expected: "buildFinanceOperationalReport", result: "active" as const },
  { area: "events", expected: "11 finance types wired", result: "active" as const },
  { area: "cockpit", expected: "dept KPI live", result: "active" as const },
] as const;
