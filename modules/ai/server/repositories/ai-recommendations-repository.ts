import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAiRecommendationsPending(
  supabase: SupabaseClient<Database>,
  limit = 80,
) {
  const { data, error } = await supabase
    .from("erp_ai_recommendations")
    .select(
      "id,recommendation_key,domain_key,priority,title,action_hint,status,expires_at,created_at",
    )
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
