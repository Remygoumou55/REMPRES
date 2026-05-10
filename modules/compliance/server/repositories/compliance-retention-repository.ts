import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceRetentionPolicies(
  supabase: SupabaseClient<Database>,
  limit = 50,
) {
  const { data, error } = await supabase
    .from("erp_compliance_retention_policies")
    .select("id,domain_key,retention_days,legal_basis,is_active,applies_to_entity_types,updated_at")
    .order("domain_key", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
