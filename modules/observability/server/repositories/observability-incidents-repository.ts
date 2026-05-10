import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listObservabilityIncidents(supabase: SupabaseClient<Database>, limit = 80) {
  const { data, error } = await supabase
    .from("erp_observability_incidents")
    .select("id,incident_key,title,severity,status,correlated_refs,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
