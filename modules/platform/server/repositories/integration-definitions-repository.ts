import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listPlatformIntegrationDefinitions(
  supabase: SupabaseClient<Database>,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("erp_platform_integration_definitions")
    .select("integration_key,display_name,category,connector_plugin_key,is_active")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
