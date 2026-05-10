import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAutomationSchedules(supabase: SupabaseClient<Database>, limit = 80) {
  const { data, error } = await supabase
    .from("erp_automation_schedules")
    .select(
      "id,workflow_key,cron_expression,timezone,next_run_at,last_run_at,is_active,payload_template,created_at",
    )
    .order("next_run_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
