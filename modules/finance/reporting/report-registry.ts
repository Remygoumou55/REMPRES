/** Identifiants reporting financier (exports PDF/CSV futurs, sans doublon métier). */
export const FINANCE_REPORT_IDS = {
  trialBalance: "finance.trial_balance",
  generalLedger: "finance.general_ledger",
  cashflowDaily: "finance.cashflow_daily",
  budgetVsActual: "finance.budget_vs_actual",
} as const;
