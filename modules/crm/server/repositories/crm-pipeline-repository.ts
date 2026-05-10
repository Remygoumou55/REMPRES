import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listCrmPipelineStages(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select("id,code,label,sort_order,probability_default,is_terminal_win,is_terminal_loss,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
