import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAiForecastArtifactsRecent(supabase: SupabaseClient<Database>, limit = 40) {
  const { data, error } = await supabase
    .from("erp_ai_forecast_artifacts")
    .select("id,artifact_key,domain_key,horizon_days,series_key,method,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
