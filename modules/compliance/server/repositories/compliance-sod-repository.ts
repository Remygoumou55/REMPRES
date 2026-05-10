import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceSodRules(supabase: SupabaseClient<Database>, limit = 80) {
  const { data, error } = await supabase
    .from("erp_compliance_sod_rules")
    .select("id,rule_key,scope_module,description,enforcement,is_active,updated_at")
    .order("rule_key", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
