import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type CrmPipelineWeightedRow = {
  opportunity_id: string;
  title: string;
  amount_estimated_gnf: number;
  probability_pct: number;
  weighted_amount_gnf: number;
  stage_code: string;
  stage_label: string;
  expected_close_date: string | null;
  owner_id: string | null;
  client_id: string | null;
  created_at: string;
};

/** Vue `v_crm_pipeline_weighted` — analytics pipeline-safe. */
export async function listCrmPipelineWeightedRows(
  supabase: SupabaseClient<Database>,
  limit = 500,
): Promise<CrmPipelineWeightedRow[]> {
  const { data, error } = await supabase
    .from("v_crm_pipeline_weighted")
    .select("*")
    .order("weighted_amount_gnf", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as CrmPipelineWeightedRow[];
}
