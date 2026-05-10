import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listObservabilityTraceEventsRecent(
  supabase: SupabaseClient<Database>,
  limit = 120,
) {
  const { data, error } = await supabase
    .from("erp_observability_trace_events")
    .select("id,trace_id,domain_key,operation_key,duration_ms,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
