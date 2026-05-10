"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { ContractHistoryEvent } from "@/modules/hr/contracts/types";

export function ContractTimelinePanel({ events }: { events: ContractHistoryEvent[] }) {
  const { t } = useTranslation();
  if (!events.length) {
    return <p className="text-xs text-gray-500">{t("dashboard.rh.contracts.timeline.empty", "Aucun evenement contrat.")}</p>;
  }
  return (
    <ul className="space-y-2">
      {events.slice(0, 20).map((event) => (
        <li key={event.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
          {new Date(event.createdAt).toLocaleString(undefined)} · {event.eventLabel}
        </li>
      ))}
    </ul>
  );
}
