import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listCrmActivitiesOpen(supabase: SupabaseClient<Database>, limit = 150) {
  const { data, error } = await supabase
    .from("crm_activities")
    .select(
      "id,activity_type,subject,due_at,completed_at,related_kind,related_id,owner_id,created_at",
    )
    .is("deleted_at", null)
    .is("completed_at", null)
    .order("due_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
