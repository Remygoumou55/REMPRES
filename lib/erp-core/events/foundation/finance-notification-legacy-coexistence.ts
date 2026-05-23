/**
 * P5 — Coexistence legacy notifications Finance.
 */

export const FINANCE_NOTIFICATION_LEGACY_COEXISTENCE_VERSION = "finance-notification-legacy-p5-v1" as const;

export type FinanceNotificationLegacyRow = {
  mechanism: string;
  location: string;
  status: "none" | "active" | "parallel";
  retireCondition: string;
};

export const FINANCE_NOTIFICATION_LEGACY_TABLE: readonly FinanceNotificationLegacyRow[] = [
  {
    mechanism: "tryCreateAlert direct Finance",
    location: "modules/finance, depenses/actions",
    status: "none",
    retireCondition: "N/A — jamais utilisé sur Finance",
  },
  {
    mechanism: "tryLogAuditEvent (expense)",
    location: "depenses/actions.ts",
    status: "parallel",
    retireCondition: "Conserver — audit forensic distinct de governance_alerts",
  },
  {
    mechanism: "assertApprovalOrThrow (legacy)",
    location: "depenses/actions.ts",
    status: "parallel",
    retireCondition: "Conserver jusqu'à migration B3.1 expense",
  },
  {
    mechanism: "Bridge finance.* → governance_alerts",
    location: "notification-finance-bridge.ts",
    status: "active",
    retireCondition: "SoT notification UI — ne pas bypasser",
  },
  {
    mechanism: "HR tryCreateAlert",
    location: "modules/hr/*",
    status: "active",
    retireCondition: "Hors scope Finance — P7 RH events",
  },
] as const;

export const FINANCE_NOTIFICATION_LEGACY_RULES = [
  "Toute alerte Finance UI doit passer finance event → bridge → dispatch → delivery.",
  "Interdit tryCreateAlert sur chemins Finance expense/transaction.",
  "Bridge validé 30j prod avant retrait mécanismes parallèles optionnels.",
] as const;
