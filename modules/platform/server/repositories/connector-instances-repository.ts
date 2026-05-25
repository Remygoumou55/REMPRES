import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listPlatformConnectorInstances(
  supabase: SupabaseClient<Database>,
  limit = 80,
) {
  const { data, error } = await supabase
    .from("erp_platform_connector_instances")
    .select(
      "id,tenant_id,connector_key,integration_key,connection_state,health_score,last_sync_at,retry_count,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPlatformConnectorLogsRecent(
  supabase: SupabaseClient<Database>,
  limit = 100,
) {
  const { data, error } = await supabase
    .from("erp_platform_connector_logs")
    .select("id,connector_instance_id,outcome,latency_ms,detail,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
