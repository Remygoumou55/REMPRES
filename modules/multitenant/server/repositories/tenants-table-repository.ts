import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listTenantsVisibleForUi(
  supabase: SupabaseClient<Database>,
  limit = 80,
): Promise<
  Pick<
    Database["public"]["Tables"]["erp_tenants"]["Row"],
    "id" | "slug" | "display_name" | "region_key" | "status" | "plan_key"
  >[]
> {
  const { data, error } = await supabase
    .from("erp_tenants")
    .select("id, slug, display_name, region_key, status, plan_key")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
