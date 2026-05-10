import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAiPipelineRunsRecent(supabase: SupabaseClient<Database>, limit = 40) {
  const { data, error } = await supabase
    .from("erp_ai_pipeline_runs")
    .select("id,pipeline_key,scope_key,status,started_at,finished_at,error_message")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
