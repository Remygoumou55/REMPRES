"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";

export function RecruitmentAlertsPanel({ candidates }: { candidates: RecruitmentCandidate[] }) {
  const { t } = useTranslation();
  const pending = candidates.filter((c) => c.pipelineStage === "pending_hire_approval");
  const offers = candidates.filter((c) => c.pipelineStage === "offer");
  if (!pending.length && !offers.length) {
    return <p className="text-xs text-gray-500">{t("dashboard.rh.recruitment.alerts.empty", "Aucune alerte.")}</p>;
  }
  return (
    <ul className="space-y-2 text-[11px]">
      {pending.map((c) => (
        <li key={c.id} className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-amber-900">
          {t("dashboard.rh.recruitment.alerts.pendingHire", "Embauche en attente")}: {c.fullName}
        </li>
      ))}
      {offers.map((c) => (
        <li key={c.id} className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-blue-900">
          {t("dashboard.rh.recruitment.alerts.offerStage", "Offre en cours")}: {c.fullName}
        </li>
      ))}
    </ul>
  );
}
