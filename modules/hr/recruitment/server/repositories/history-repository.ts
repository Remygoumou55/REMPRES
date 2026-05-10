import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentHistoryEvent } from "@/modules/hr/recruitment/types";

export async function listRecruitmentHistory(candidateId: string): Promise<RecruitmentHistoryEvent[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_history")
    .select("id,candidate_id,event_type,event_label,created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(300);

  return (data ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    eventType: row.event_type,
    eventLabel: row.event_label,
    createdAt: row.created_at,
  }));
}
