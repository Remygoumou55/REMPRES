import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAutomationEventsRecent(supabase: SupabaseClient<Database>, limit = 150) {
  const { data, error } = await supabase
    .from("erp_automation_events")
    .select("id,event_key,domain_key,aggregate_type,aggregate_id,correlation_id,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
