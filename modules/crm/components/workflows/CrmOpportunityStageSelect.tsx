"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCrmOpportunityStageAction } from "@/modules/crm/server/actions/crm-actions";

type StageOption = { id: string; label: string; code: string };

type CrmOpportunityStageSelectProps = {
  opportunityId: string;
  currentStageId: string;
  currentTerminal: boolean;
  stages: StageOption[];
};

export function CrmOpportunityStageSelect({
  opportunityId,
  currentStageId,
  currentTerminal,
  stages,
}: CrmOpportunityStageSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (currentTerminal) {
    return <span className="text-xs text-gray-400">Terminal</span>;
  }

  return (
    <select
      className="max-w-[160px] rounded border border-gray-200 px-2 py-1 text-xs"
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        if (!next || next === currentStageId) return;
        startTransition(async () => {
          await updateCrmOpportunityStageAction(opportunityId, next);
          router.refresh();
        });
      }}
    >
      <option value="">Étape…</option>
      {stages
        .filter((s) => s.id !== currentStageId)
        .map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
    </select>
  );
}
