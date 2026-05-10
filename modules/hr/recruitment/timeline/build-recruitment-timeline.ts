import type { RecruitmentHistoryEvent } from "@/modules/hr/recruitment/types";

export function buildRecruitmentTimeline(events: RecruitmentHistoryEvent[]): RecruitmentHistoryEvent[] {
  return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
