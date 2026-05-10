import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";
import { computeRecruitmentMetrics } from "@/modules/hr/recruitment/analytics/recruitment-metrics";

export function buildRecruitmentReport(candidates: RecruitmentCandidate[]) {
  const metrics = computeRecruitmentMetrics(candidates);
  return {
    generatedAt: new Date().toISOString(),
    metrics,
    candidates,
  };
}
