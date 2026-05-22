/**
 * B3 — Règles d'agrégation finance (alignées financial_transactions / finance-overview).
 */

export const FINANCE_FT_SOURCE_SALE = "sale" as const;
export const FINANCE_FT_SOURCE_EXPENSE = "expense" as const;

/** Statuts exclus des agrégats opérationnels (cohérent vente net / B2.0). */
export const FINANCE_FT_EXCLUDED_STATUS = "cancelled" as const;

export function isNetSaleFinancialTransaction(row: {
  source_type: string;
  status: string | null;
}): boolean {
  return row.source_type === FINANCE_FT_SOURCE_SALE && row.status !== FINANCE_FT_EXCLUDED_STATUS;
}

export function isActiveExpenseFinancialTransaction(row: {
  source_type: string;
  status: string | null;
}): boolean {
  return row.source_type === FINANCE_FT_SOURCE_EXPENSE && row.status !== FINANCE_FT_EXCLUDED_STATUS;
}
