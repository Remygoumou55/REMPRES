import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listCloudRegionsBrief(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; region_key: string; display_name: string; status: string }[]> {
  const { data, error } = await supabase
    .from("erp_cloud_regions")
    .select("id, region_key, display_name, status")
    .order("region_key", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
