import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listListedCatalogPlugins(
  supabase: SupabaseClient<Database>,
  limit = 100,
): Promise<
  Pick<
    Database["public"]["Tables"]["erp_platform_catalog_plugins"]["Row"],
    "id" | "plugin_key" | "display_name" | "kind" | "publisher_key" | "risk_tier"
  >[]
> {
  const { data, error } = await supabase
    .from("erp_platform_catalog_plugins")
    .select("id, plugin_key, display_name, kind, publisher_key, risk_tier")
    .eq("is_listed", true)
    .order("display_name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
