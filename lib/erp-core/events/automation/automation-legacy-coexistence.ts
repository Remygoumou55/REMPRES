/**
 * P6 — Coexistence automation / legacy / manuel.
 */

export const AUTOMATION_LEGACY_COEXISTENCE_VERSION = "automation-legacy-coexistence-p6-v1" as const;

export const AUTOMATION_LEGACY_COEXISTENCE_RULES = [
  "Mutations métier restent manuelles ou gate B3 — automation ne write pas.",
  "Notifications UI restent bridge → dispatch → governance_alerts.",
  "HR tryCreateAlert conservé jusqu'à RH event foundation P7.",
  "Automation trace validée 30j avant toute action write P6.1+.",
] as const;

export const AUTOMATION_MANUAL_RETENTION = [
  "finance.journal.post — manuel / approval B3.1",
  "crm mutations — crm-mutations + gate",
  "expense CRUD — finance-expense-mutations",
  "super_admin approval UI — admin/approvals",
] as const;
