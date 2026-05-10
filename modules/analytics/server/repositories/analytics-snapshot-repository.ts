import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { ANALYTICS_SCOPE_KEYS } from "@/modules/analytics/constants/cache-tags";

export async function fetchRhDeptKpisSnapshotRow(): Promise<{
  payload: unknown;
  computed_at: string;
} | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_analytics_snapshots")
    .select("payload, computed_at")
    .eq("scope_key", ANALYTICS_SCOPE_KEYS.rhDeptKpisV1)
    .maybeSingle();

  if (error || !data) return null;
  return { payload: data.payload, computed_at: data.computed_at };
}
