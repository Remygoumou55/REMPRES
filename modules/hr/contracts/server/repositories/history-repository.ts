import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ContractHistoryEvent } from "@/modules/hr/contracts/types";

export async function listContractHistory(contractId: string): Promise<ContractHistoryEvent[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_contract_history")
    .select("id,contract_id,event_type,event_label,created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).map((row) => ({
    id: row.id,
    contractId: row.contract_id,
    eventType: row.event_type,
    eventLabel: row.event_label,
    createdAt: row.created_at,
  }));
}

