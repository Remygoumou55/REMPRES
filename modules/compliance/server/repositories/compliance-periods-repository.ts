import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceAccountingPeriods(
  supabase: SupabaseClient<Database>,
  limit = 120,
) {
  const { data, error } = await supabase
    .from("erp_compliance_accounting_periods")
    .select(
      "id,legal_entity_key,label,period_start,period_end,fiscal_year,fiscal_month,status,created_at",
    )
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
