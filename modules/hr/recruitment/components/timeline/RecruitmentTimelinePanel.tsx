"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { RecruitmentHistoryEvent } from "@/modules/hr/recruitment/types";

export function RecruitmentTimelinePanel({ events }: { events: RecruitmentHistoryEvent[] }) {
  const { t } = useTranslation();
  if (!events.length) {
    return <p className="text-xs text-gray-500">{t("dashboard.rh.recruitment.timeline.empty", "Aucun evenement.")}</p>;
  }
  return (
    <ul className="max-h-48 space-y-1 overflow-y-auto text-[11px]">
      {events.slice(0, 40).map((e) => (
        <li key={e.id} className="rounded border border-gray-100 px-2 py-1">
          {new Date(e.createdAt).toLocaleString()} · {e.eventLabel}
        </li>
      ))}
    </ul>
  );
}
