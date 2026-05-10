import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAutomationWorkflowDefinitions(
  supabase: SupabaseClient<Database>,
  limit = 100,
) {
  const { data, error } = await supabase
    .from("erp_automation_workflow_definitions")
    .select("workflow_key,domain_key,label,description,version,is_active,updated_at")
    .order("workflow_key", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
