import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { RecruitmentEvaluation } from "@/modules/hr/recruitment/types";

export async function listEvaluations(candidateId: string): Promise<RecruitmentEvaluation[]> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("rh_recruitment_evaluations")
    .select("id,candidate_id,evaluator_user_id,score,recommendation,comments,created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id,
    candidateId: row.candidate_id,
    evaluatorUserId: row.evaluator_user_id,
    score: row.score,
    recommendation: row.recommendation,
    comments: row.comments,
    createdAt: row.created_at,
  }));
}
