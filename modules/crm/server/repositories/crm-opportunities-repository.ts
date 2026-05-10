import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type CrmOpportunityWithStage = Database["public"]["Tables"]["crm_opportunities"]["Row"] & {
  crm_pipeline_stages: Pick<
    Database["public"]["Tables"]["crm_pipeline_stages"]["Row"],
    "code" | "label" | "is_terminal_win" | "is_terminal_loss"
  > | null;
};

export async function listCrmOpportunitiesWithStages(
  supabase: SupabaseClient<Database>,
  limit = 200,
): Promise<CrmOpportunityWithStage[]> {
  const { data, error } = await supabase
    .from("crm_opportunities")
    .select(
      "id,title,client_id,lead_id,stage_id,amount_estimated_gnf,probability_pct,expected_close_date,owner_id,created_at,crm_pipeline_stages(code,label,is_terminal_win,is_terminal_loss)",
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmOpportunityWithStage[];
}
