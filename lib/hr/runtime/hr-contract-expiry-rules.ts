/**
 * P7.3 — Règles d'échéance contrat RH (fenêtre renouvellement).
 */

export const HR_CONTRACT_EXPIRY_RULES_VERSION = "hr-contract-expiry-rules-p7-3-v1" as const;

/** Fenêtre par défaut si renewal_window_days absent en DB. */
export const HR_CONTRACT_DEFAULT_RENEWAL_WINDOW_DAYS = 30;

export const HR_CONTRACT_EXPIRY_ELIGIBLE_STATUSES = ["active", "renewal_due"] as const;

export type HrContractExpiryEligibleStatus = (typeof HR_CONTRACT_EXPIRY_ELIGIBLE_STATUSES)[number];
