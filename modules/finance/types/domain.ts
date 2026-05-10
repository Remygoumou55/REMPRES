import type { Database } from "@/types/database.types";

export type FinanceAccountRow = Database["public"]["Tables"]["finance_accounts"]["Row"];
export type FinanceJournalBatchRow = Database["public"]["Tables"]["finance_journal_batches"]["Row"];
export type FinanceJournalLineRow = Database["public"]["Tables"]["finance_journal_lines"]["Row"];
export type FinanceArInvoiceRow = Database["public"]["Tables"]["finance_ar_invoices"]["Row"];
export type FinanceBudgetRow = Database["public"]["Tables"]["finance_budgets"]["Row"];
export type FinanceCashflowDailyRow = Database["public"]["Tables"]["finance_cashflow_daily"]["Row"];
