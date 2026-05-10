import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceRiskSignalsOpen(supabase: SupabaseClient<Database>, limit = 120) {
  const { data, error } = await supabase
    .from("erp_compliance_risk_signals")
    .select(
      "id,rule_key,severity,domain_key,entity_type,entity_id,status,detected_at,metadata",
    )
    .eq("status", "open")
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
