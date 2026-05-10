import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentInterview } from "@/modules/hr/recruitment/types";

export async function listInterviews(candidateId: string): Promise<RecruitmentInterview[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_interviews")
    .select(
      "id,candidate_id,interview_type,scheduled_at,duration_minutes,location_note,status,notes,created_at",
    )
    .eq("candidate_id", candidateId)
    .order("scheduled_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    interviewType: row.interview_type,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    locationNote: row.location_note,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}
