"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { PIPELINE_STAGES, type PipelineStage } from "@/modules/hr/recruitment/constants";
import type { RecruitmentCandidate } from "@/modules/hr/recruitment/types";
import {
  advanceCandidatePipelineAction,
  submitHireForApprovalAction,
} from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function RecruitmentPipelinePanel({ candidate }: { candidate: RecruitmentCandidate }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const defaultNext =
    PIPELINE_STAGES.find((s) => s !== candidate.pipelineStage) ?? candidate.pipelineStage;
  const [targetStage, setTargetStage] = useState<PipelineStage>(defaultNext);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = PIPELINE_STAGES.find((s) => s !== candidate.pipelineStage) ?? candidate.pipelineStage;
    setTargetStage(next);
  }, [candidate.id, candidate.pipelineStage]);

  const refresh = () => router.refresh();

  const advance = () => {
    setError(null);
    startTransition(async () => {
      const result = await advanceCandidatePipelineAction({ candidateId: candidate.id, nextStage: targetStage });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh();
    });
  };

  const submitHire = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitHireForApprovalAction({ candidateId: candidate.id });
      if (!result.success) {
        setError(result.error);
        return;
      }
      refresh();
    });
  };

  const frozen =
    candidate.pipelineStage === "hired" ||
    candidate.pipelineStage === "withdrawn" ||
    candidate.pipelineStage === "rejected" ||
    candidate.pipelineStage === "pending_hire_approval";

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600">
        {t("dashboard.rh.recruitment.pipeline.current", "Etape actuelle")}:{" "}
        <span className="font-semibold text-darktext">{candidate.pipelineStage}</span>
      </p>
      {candidate.pipelineStage === "pending_hire_approval" ? (
        <p className="text-xs text-amber-700">
          {t(
            "dashboard.rh.recruitment.pipeline.awaitingHireApproval",
            "Embauche en attente de validation super-admin.",
          )}
        </p>
      ) : null}
      {!frozen ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={targetStage}
            onChange={(e) => setTargetStage(e.target.value as PipelineStage)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          >
            {PIPELINE_STAGES.filter((s) => s !== candidate.pipelineStage).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || targetStage === candidate.pipelineStage}
            onClick={advance}
            className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white"
          >
            {t("dashboard.rh.recruitment.pipeline.applyStage", "Appliquer etape")}
          </button>
          {candidate.pipelineStage === "offer" ? (
            <button
              type="button"
              disabled={pending}
              onClick={submitHire}
              className="rounded-lg bg-emerald-700 px-2 py-1 text-xs font-semibold text-white"
            >
              {t("dashboard.rh.recruitment.pipeline.submitHire", "Soumettre embauche")}
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
