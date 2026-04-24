import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Json } from "@/types/database.types";

/**
 * Insère une ligne dans public.activity_logs (soumis aux RLS : acteur = session ou super admin).
 */
export async function insertActivityLog(params: {
  actorUserId: string;
  moduleKey: string;
  actionKey: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Json;
}): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("activity_logs").insert({
    actor_user_id: params.actorUserId,
    module_key: params.moduleKey,
    action_key: params.actionKey,
    target_table: params.targetTable,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) {
    throw new Error(`Impossible d'écrire le journal d'activité : ${error.message}`);
  }
}
