import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listComplianceSnapshotsRecent(
  supabase: SupabaseClient<Database>,
  limit = 80,
) {
  const { data, error } = await supabase
    .from("erp_compliance_snapshots")
    .select("id,snapshot_key,domain_key,fiscal_year,content_hash,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
