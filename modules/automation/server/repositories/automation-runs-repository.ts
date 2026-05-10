import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAutomationWorkflowRuns(supabase: SupabaseClient<Database>, limit = 120) {
  const { data, error } = await supabase
    .from("erp_automation_workflow_runs")
    .select(
      "id,workflow_key,status,current_step,sla_deadline_at,escalated_at,approval_request_id,created_at,created_by",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
