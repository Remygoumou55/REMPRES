import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listFinanceArInvoices(
  supabase: SupabaseClient<Database>,
  limit = 100,
): Promise<Database["public"]["Tables"]["finance_ar_invoices"]["Row"][]> {
  const { data, error } = await supabase
    .from("finance_ar_invoices")
    .select("*")
    .order("issue_date", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countFinanceArInvoicesByStatuses(
  supabase: SupabaseClient<Database>,
  statuses: readonly Database["public"]["Tables"]["finance_ar_invoices"]["Row"]["status"][],
): Promise<number> {
  const { count, error } = await supabase
    .from("finance_ar_invoices")
    .select("id", { count: "exact", head: true })
    .in("status", [...statuses]);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
