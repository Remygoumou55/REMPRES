import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listResilienceScenariosBrief(
  supabase: SupabaseClient<Database>,
  limit = 32,
): Promise<{ id: string; scenario_key: string; category: string; enabled: boolean }[]> {
  const { data, error } = await supabase
    .from("erp_resilience_scenarios")
    .select("id, scenario_key, category, enabled")
    .order("scenario_key", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
