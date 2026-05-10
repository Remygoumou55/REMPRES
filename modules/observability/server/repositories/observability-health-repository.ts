import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listObservabilityHealthSnapshots(
  supabase: SupabaseClient<Database>,
  scopeKey = "global",
  limit = 60,
) {
  const { data, error } = await supabase
    .from("erp_observability_health_snapshots")
    .select("id,scope_key,health_score,signal_breakdown,predictive_hint,computed_at")
    .eq("scope_key", scopeKey)
    .order("computed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
