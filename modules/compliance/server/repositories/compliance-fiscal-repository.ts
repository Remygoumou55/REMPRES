import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceFiscalLocks(supabase: SupabaseClient<Database>, limit = 80) {
  const { data, error } = await supabase
    .from("erp_compliance_fiscal_locks")
    .select("legal_entity_key,fiscal_year,journal_locked,locked_at,updated_at")
    .order("fiscal_year", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
