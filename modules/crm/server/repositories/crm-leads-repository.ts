import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listCrmLeadsRecent(supabase: SupabaseClient<Database>, limit = 150) {
  const { data, error } = await supabase
    .from("crm_leads")
    .select(
      "id,status,source,company_name,contact_first_name,contact_last_name,email,estimated_value_gnf,currency,owner_id,created_at",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
