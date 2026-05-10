import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { countFinanceJournalBatchesByStatus } from "@/modules/finance/server/repositories/finance-journal-repository";
import { countFinanceArInvoicesByStatuses } from "@/modules/finance/server/repositories/finance-invoices-repository";

export type FinanceEnterpriseOverview = {
  journalDraftCount: number;
  journalPostedCount: number;
  arOpenCount: number;
  paymentsMonthCount: number;
};

export async function getFinanceEnterpriseOverview(
  supabase: SupabaseClient<Database>,
): Promise<FinanceEnterpriseOverview> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthIso = startOfMonth.toISOString();

  const [journalDraftCount, journalPostedCount, arOpenCount, paymentsRes] = await Promise.all([
    countFinanceJournalBatchesByStatus(supabase, "draft"),
    countFinanceJournalBatchesByStatus(supabase, "posted"),
    countFinanceArInvoicesByStatuses(supabase, ["draft", "sent", "partially_paid"]),
    supabase
      .from("finance_payment_allocations")
      .select("id", { count: "exact", head: true })
      .gte("paid_at", monthIso),
  ]);

  if (paymentsRes.error) throw new Error(paymentsRes.error.message);

  return {
    journalDraftCount,
    journalPostedCount,
    arOpenCount,
    paymentsMonthCount: paymentsRes.count ?? 0,
  };
}
