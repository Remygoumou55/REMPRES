import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listObservabilityCorrelationsRecent(
  supabase: SupabaseClient<Database>,
  limit = 150,
) {
  const { data, error } = await supabase
    .from("erp_observability_correlations")
    .select("id,incident_id,source_kind,source_id,weight,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
