/**
 * P4 — Stratégie coexistence legacy Finance (pas de suppression brutale).
 */

export const FINANCE_LEGACY_COEXISTENCE_VERSION = "finance-legacy-coexistence-p4-v1" as const;

export type FinanceLegacyCoexistenceRow = {
  mechanism: string;
  location: string;
  status: "active" | "parallel" | "retire_after_handler";
  retireCondition: string;
};

export const FINANCE_LEGACY_COEXISTENCE_TABLE: readonly FinanceLegacyCoexistenceRow[] = [
  {
    mechanism: "create_expense_transaction RPC",
    location: "lib/server/expenses.ts",
    status: "active",
    retireCondition: "Jamais — SoT DB ; seul le wrapper TS migre vers B3 gate",
  },
  {
    mechanism: "assertApprovalOrThrow (legacy)",
    location: "app/(app)/finance/depenses/actions.ts",
    status: "active",
    retireCondition: "Handler notification-finance validé + B3 gate expense activé",
  },
  {
    mechanism: "tryLogAuditEvent / insertActivityLog",
    location: "depenses/actions.ts, expenses.ts",
    status: "active",
    retireCondition: "recordFinanceGovernanceAudit branché + forensic validé 30j",
  },
  {
    mechanism: "getFinanceCfoData (treasury SoT)",
    location: "lib/server/finance-overview.ts",
    status: "active",
    retireCondition: "Jamais — runtime lecture B3 délègue ici",
  },
  {
    mechanism: "getModulePermissions(finance) sur pages",
    location: "app/(app)/finance/*",
    status: "parallel",
    retireCondition: "assertFinanceRuntimeReadAccess aligné sur toutes pages finance",
  },
  {
    mechanism: "recordFinanceGovernanceAudit",
    location: "modules/finance/server/services/finance-audit-hook.ts",
    status: "parallel",
    retireCondition: "Premier write P4.1 câblé — appeler après publish bus",
  },
  {
    mechanism: "Bus audit persist (persistAudit:true)",
    location: "event-bus event_traceability",
    status: "retire_after_handler",
    retireCondition: "Non utilisé pour integration publish — audit métier suffit",
  },
] as const;

export const FINANCE_LEGACY_COEXISTENCE_RULES = [
  "Ordre obligatoire : gate → write → publisher → audit legacy (parallèle OK).",
  "Ne pas retirer tryLogAuditEvent avant handler finance.* validé en prod.",
  "financial_transactions reste SoT unique — events ne dupliquent pas les montants.",
  "Handler notification-finance-bridge (P5) requis avant retrait alertes directes.",
] as const;
