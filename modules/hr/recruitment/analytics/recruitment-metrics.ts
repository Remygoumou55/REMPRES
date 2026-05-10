import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";
import type { RecruitmentInterview } from "@/modules/hr/recruitment/types";

export function computeRecruitmentMetrics(candidates: RecruitmentCandidate[]) {
  const byStage = candidates.reduce<Record<string, number>>((acc, c) => {
    acc[c.pipelineStage] = (acc[c.pipelineStage] ?? 0) + 1;
    return acc;
  }, {});
  return {
    total: candidates.length,
    byStage,
    activePipeline: candidates.filter((c) => !["hired", "rejected", "withdrawn"].includes(c.pipelineStage)).length,
    pendingHire: candidates.filter((c) => c.pipelineStage === "pending_hire_approval").length,
    hired: candidates.filter((c) => c.pipelineStage === "hired").length,
  };
}

export function upcomingInterviewsCount(interviews: RecruitmentInterview[], daysAhead = 7): number {
  const now = Date.now();
  const horizon = now + daysAhead * 24 * 60 * 60 * 1000;
  return interviews.filter((i) => i.status === "scheduled" && new Date(i.scheduledAt).getTime() <= horizon).length;
}
