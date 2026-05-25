/**
 * Finance domain governance — Bloc 3 Étape 2.
 */
export const FINANCE_DOMAIN_GOVERNANCE_VERSION = "finance-domain-governance-bloc3-v1" as const;

export const FINANCE_DOMAIN_GOVERNANCE = {
  version: FINANCE_DOMAIN_GOVERNANCE_VERSION,
  departmentKey: "FINANCE",
  transactionSoT: "financial_transactions",
  enterpriseTables: "finance_*",
  eventOwner: "finance",
} as const;

export const FINANCE_CAPABILITY_STATUS = {
  transactions: "active",
  expenses: "active",
  journalPost: "active",
  reporting: "active",
  approvalWorkflow: "active",
  paymentAllocate: "planned",
} as const;
