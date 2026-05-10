import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listAiAssistantEventsRecent(supabase: SupabaseClient<Database>, limit = 80) {
  const { data, error } = await supabase
    .from("erp_ai_assistant_events")
    .select("id,session_key,event_kind,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
