import type { RecruitmentHistoryEvent } from "@/modules/hr/recruitment/types";

export function buildRecruitmentHistory(events: RecruitmentHistoryEvent[]): RecruitmentHistoryEvent[] {
  return events.map((e) => ({
    ...e,
    eventLabel: String(e.eventLabel ?? "").trim() || e.eventType,
  }));
}
