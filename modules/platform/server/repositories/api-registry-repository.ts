import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listPlatformApiRegistry(supabase: SupabaseClient<Database>, limit = 50) {
  const { data, error } = await supabase
    .from("erp_platform_api_registry")
    .select("api_key,display_name,version,auth_method,rate_limit_per_minute,lifecycle_status,owner_module,exposure_scope")
    .order("api_key", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
