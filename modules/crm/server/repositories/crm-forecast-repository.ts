import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listCrmForecastSnapshotsRecent(supabase: SupabaseClient<Database>, limit = 24) {
  const { data, error } = await supabase
    .from("crm_forecast_snapshots")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
