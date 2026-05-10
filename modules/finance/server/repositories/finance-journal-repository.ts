import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listFinanceJournalBatches(
  supabase: SupabaseClient<Database>,
  limit = 80,
): Promise<Database["public"]["Tables"]["finance_journal_batches"]["Row"][]> {
  const { data, error } = await supabase
    .from("finance_journal_batches")
    .select("*")
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listFinanceJournalBatchesByStatus(
  supabase: SupabaseClient<Database>,
  status: Database["public"]["Tables"]["finance_journal_batches"]["Row"]["status"],
  limit = 80,
): Promise<Database["public"]["Tables"]["finance_journal_batches"]["Row"][]> {
  const { data, error } = await supabase
    .from("finance_journal_batches")
    .select("*")
    .eq("status", status)
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countFinanceJournalBatchesByStatus(
  supabase: SupabaseClient<Database>,
  status: Database["public"]["Tables"]["finance_journal_batches"]["Row"]["status"],
): Promise<number> {
  const { count, error } = await supabase
    .from("finance_journal_batches")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
