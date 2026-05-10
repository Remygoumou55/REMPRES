import { buildRecruitmentHistory } from "@/modules/hr/recruitment/history/build-recruitment-history";
import { buildRecruitmentReport } from "@/modules/hr/recruitment/reporting/build-recruitment-report";
import { buildRecruitmentTimeline } from "@/modules/hr/recruitment/timeline/build-recruitment-timeline";
import { getCandidateById, listCandidates } from "@/modules/hr/recruitment/server/repositories/candidates-repository";
import { listCandidateDocuments } from "@/modules/hr/recruitment/server/repositories/documents-repository";
import { listEvaluations } from "@/modules/hr/recruitment/server/repositories/evaluations-repository";
import { listRecruitmentHistory } from "@/modules/hr/recruitment/server/repositories/history-repository";
import { listInterviews } from "@/modules/hr/recruitment/server/repositories/interviews-repository";
import { getOnboardingByCandidateId } from "@/modules/hr/recruitment/server/repositories/onboarding-repository";

export async function getRecruitmentDomainSnapshot() {
  const candidates = await listCandidates();
  const reporting = buildRecruitmentReport(candidates);
  const proactiveAlerts = candidates
    .filter((c) => c.pipelineStage === "pending_hire_approval" || c.pipelineStage === "offer")
    .slice(0, 15)
    .map((c) => `recruitment:${c.id}:${c.pipelineStage}`);
  return { candidates, metrics: reporting.metrics, reporting, proactiveAlerts };
}

export async function getRecruitmentCandidateDetails(candidateId: string) {
  const [candidate, documents, historyRaw, interviews, evaluations, onboarding] = await Promise.all([
    getCandidateById(candidateId),
    listCandidateDocuments(candidateId),
    listRecruitmentHistory(candidateId),
    listInterviews(candidateId),
    listEvaluations(candidateId),
    getOnboardingByCandidateId(candidateId),
  ]);
  const history = buildRecruitmentHistory(historyRaw);
  return {
    candidate,
    documents,
    history,
    timeline: buildRecruitmentTimeline(history),
    interviews,
    evaluations,
    onboarding,
  };
}
