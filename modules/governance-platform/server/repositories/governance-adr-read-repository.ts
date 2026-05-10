import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listGovernanceAdrsBrief(
  supabase: SupabaseClient<Database>,
  limit = 24,
): Promise<
  {
    id: string;
    adr_key: string;
    title: string;
    decision_status: string;
  }[]
> {
  const { data, error } = await supabase
    .from("erp_governance_architecture_decisions")
    .select("id, adr_key, title, decision_status")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
