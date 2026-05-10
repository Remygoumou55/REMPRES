"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { ONBOARDING_STATUSES } from "@/modules/hr/recruitment/constants";
import type { RecruitmentCandidate, RecruitmentOnboarding } from "@/modules/hr/recruitment/types";
import {
  linkCandidateToEmployeeDomainAction,
  updateOnboardingAction,
} from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function OnboardingPanel({
  candidate,
  onboarding,
}: {
  candidate: RecruitmentCandidate;
  onboarding: RecruitmentOnboarding | null;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<(typeof ONBOARDING_STATUSES)[number]>(
    (onboarding?.status as (typeof ONBOARDING_STATUSES)[number]) ?? "not_started",
  );
  const [profileId, setProfileId] = useState(onboarding?.linkedProfileId ?? candidate.hiredProfileId ?? "");
  const [contractId, setContractId] = useState(onboarding?.linkedContractId ?? candidate.hiredContractId ?? "");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  if (candidate.pipelineStage !== "hired") {
    return (
      <p className="text-xs text-gray-500">
        {t("dashboard.rh.recruitment.onboarding.onlyHired", "Onboarding disponible apres embauche approuvee.")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-[10px] text-gray-600">
          {t("dashboard.rh.recruitment.onboarding.status", "Statut onboarding")}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof ONBOARDING_STATUSES)[number])}
            className="mt-0.5 rounded border border-gray-200 px-2 py-1 text-xs"
          >
            {ONBOARDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          className="rounded-lg bg-gray-800 px-2 py-1 text-xs text-white"
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await updateOnboardingAction({
                candidateId: candidate.id,
                status,
              });
              if (!result.success) setError(result.error);
              else refresh();
            });
          }}
        >
          {t("dashboard.rh.recruitment.onboarding.saveStatus", "Enregistrer statut")}
        </button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <input
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.onboarding.profileId", "ID profil collaborateur")}
        />
        <input
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.onboarding.contractId", "ID contrat RH (optionnel)")}
        />
      </div>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await linkCandidateToEmployeeDomainAction({
              candidateId: candidate.id,
              profileId: profileId.trim(),
              contractId: contractId.trim() || null,
            });
            if (!result.success) setError(result.error);
            else refresh();
          });
        }}
      >
        {t("dashboard.rh.recruitment.onboarding.linkDomains", "Rattacher employe / contrat")}
      </button>
      {onboarding ? (
        <p className="text-[10px] text-gray-500">
          checklist JSON — {JSON.stringify(onboarding.checklist).slice(0, 120)}
          {JSON.stringify(onboarding.checklist).length > 120 ? "…" : ""}
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
