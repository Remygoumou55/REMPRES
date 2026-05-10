import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listObservabilityPredictionsRecent(
  supabase: SupabaseClient<Database>,
  limit = 40,
) {
  const { data, error } = await supabase
    .from("erp_observability_predictions")
    .select("id,prediction_key,horizon_hours,scope_key,projected_risk,rationale,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
