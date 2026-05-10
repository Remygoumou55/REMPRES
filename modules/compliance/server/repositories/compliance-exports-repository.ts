import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceExportManifests(
  supabase: SupabaseClient<Database>,
  limit = 100,
) {
  const { data, error } = await supabase
    .from("erp_compliance_export_manifests")
    .select("id,export_kind,domain_key,legal_hold,requested_by,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
