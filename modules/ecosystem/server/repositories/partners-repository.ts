import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listPartnersForUi(
  supabase: SupabaseClient<Database>,
  limit = 120,
): Promise<
  Pick<
    Database["public"]["Tables"]["erp_ecosystem_partners"]["Row"],
    "id" | "partner_key" | "display_name" | "tier" | "status" | "headquarters_region"
  >[]
> {
  const { data, error } = await supabase
    .from("erp_ecosystem_partners")
    .select("id, partner_key, display_name, tier, status, headquarters_region")
    .order("display_name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
