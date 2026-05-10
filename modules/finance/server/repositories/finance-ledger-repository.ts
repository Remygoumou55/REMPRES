import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Aligné sur la vue `v_finance_general_ledger` (migration 047). */
export type FinanceGeneralLedgerViewRow = {
  line_id: string;
  batch_id: string;
  booking_date: string;
  batch_reference: string;
  batch_status: string;
  account_id: string;
  account_code: string;
  account_label: string;
  debit_credit: string;
  amount_gnf: number;
  memo: string | null;
  source_module: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
  posted_at: string | null;
  line_created_at: string;
};

export async function listFinanceGeneralLedger(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string,
  limit = 500,
): Promise<FinanceGeneralLedgerViewRow[]> {
  const { data, error } = await supabase
    .from("v_finance_general_ledger")
    .select("*")
    .gte("booking_date", from)
    .lte("booking_date", to)
    .order("booking_date", { ascending: false })
    .order("line_id", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as FinanceGeneralLedgerViewRow[];
}
