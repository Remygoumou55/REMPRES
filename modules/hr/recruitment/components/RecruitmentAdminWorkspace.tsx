"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { PIPELINE_STAGES } from "@/modules/hr/recruitment/constants";
import type {
  RecruitmentDocument,
  RecruitmentEvaluation,
  RecruitmentHistoryEvent,
  RecruitmentInterview,
  RecruitmentOnboarding,
  RecruitmentCandidate,
} from "@/modules/hr/recruitment/types";
import { useRecruitmentAnalytics } from "@/modules/hr/recruitment/hooks/use-recruitment-analytics";
import { useRecruitmentFilters } from "@/modules/hr/recruitment/hooks/use-recruitment-filters";
import { CandidateCreateForm } from "@/modules/hr/recruitment/components/forms/CandidateCreateForm";
import { RecruitmentPipelinePanel } from "@/modules/hr/recruitment/components/pipeline/RecruitmentPipelinePanel";
import { InterviewPanel } from "@/modules/hr/recruitment/components/interviews/InterviewPanel";
import { EvaluationPanel } from "@/modules/hr/recruitment/components/evaluations/EvaluationPanel";
import { CandidateDocumentsPanel } from "@/modules/hr/recruitment/components/documents/CandidateDocumentsPanel";
import { RecruitmentTimelinePanel } from "@/modules/hr/recruitment/components/timeline/RecruitmentTimelinePanel";
import { RecruitmentAnalyticsPanel } from "@/modules/hr/recruitment/components/analytics/RecruitmentAnalyticsPanel";
import { RecruitmentAlertsPanel } from "@/modules/hr/recruitment/components/alerts/RecruitmentAlertsPanel";
import { OnboardingPanel } from "@/modules/hr/recruitment/components/onboarding/OnboardingPanel";

export type RecruitmentDetailPack = {
  documents: RecruitmentDocument[];
  timeline: RecruitmentHistoryEvent[];
  interviews: RecruitmentInterview[];
  evaluations: RecruitmentEvaluation[];
  onboarding: RecruitmentOnboarding | null;
};

export function RecruitmentAdminWorkspace({
  candidates,
  detailsByCandidateId,
}: {
  candidates: RecruitmentCandidate[];
  detailsByCandidateId: Record<string, RecruitmentDetailPack>;
}) {
  const { t } = useTranslation();
  const { query, setQuery, stage, setStage, filtered } = useRecruitmentFilters(candidates);
  const metrics = useRecruitmentAnalytics(filtered);
  const [selectedId, setSelectedId] = useState<string | null>(filtered[0]?.id ?? null);

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );
  const details = selected ? detailsByCandidateId[selected.id] : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <a
          href="/api/rh/recruitment/export?format=csv"
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-primary hover:bg-gray-50"
        >
          {t("dashboard.rh.recruitment.exportCsv", "Export CSV")}
        </a>
        <Link href="/api/rh/recruitment/report" className="text-xs font-medium text-primary hover:underline">
          {t("dashboard.rh.recruitment.reportJson", "Rapport JSON")}
        </Link>
      </div>

      <section className="card p-4">
        <h2 className="section-title mb-3">{t("dashboard.rh.recruitment.section.create", "Nouveau candidat")}</h2>
        <CandidateCreateForm />
      </section>

      <section className="card p-4 space-y-3">
        <div className="grid gap-2 md:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.rh.recruitment.search", "Recherche...")}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm md:col-span-2"
          >
            <option value="">{t("dashboard.rh.recruitment.allStages", "Toutes etapes")}</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <RecruitmentAnalyticsPanel metrics={metrics} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-4 space-y-2">
          <h2 className="section-title">{t("dashboard.rh.recruitment.section.candidates", "Candidats")}</h2>
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id} className="rounded-lg border border-gray-200 p-2">
                <button type="button" className="w-full text-left text-xs" onClick={() => setSelectedId(c.id)}>
                  <span className="font-semibold">{c.fullName}</span>
                  <span className="block text-[10px] text-gray-500">
                    {c.jobTitle} · {c.pipelineStage}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4 space-y-3">
          <h2 className="section-title">{t("dashboard.rh.recruitment.section.workflow", "Pipeline et alertes")}</h2>
          {selected ? (
            <RecruitmentPipelinePanel candidate={selected} />
          ) : (
            <p className="text-xs text-gray-500">{t("dashboard.rh.recruitment.noneSelected", "Aucune selection.")}</p>
          )}
        </section>
      </div>

      {selected && details ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card p-4 space-y-2">
            <h2 className="section-title">{t("dashboard.rh.recruitment.section.interviews", "Entretiens")}</h2>
            <InterviewPanel candidateId={selected.id} interviews={details.interviews} />
          </section>
          <section className="card p-4 space-y-2">
            <h2 className="section-title">{t("dashboard.rh.recruitment.section.evaluations", "Evaluations")}</h2>
            <EvaluationPanel candidateId={selected.id} evaluations={details.evaluations} />
          </section>
          <section className="card p-4 space-y-2">
            <h2 className="section-title">{t("dashboard.rh.recruitment.section.documents", "Documents")}</h2>
            <CandidateDocumentsPanel candidateId={selected.id} documents={details.documents} />
          </section>
          <section className="card p-4 space-y-2">
            <h2 className="section-title">{t("dashboard.rh.recruitment.section.timeline", "Timeline")}</h2>
            <RecruitmentTimelinePanel events={details.timeline} />
          </section>
          <section className="card p-4 space-y-2 lg:col-span-2">
            <h2 className="section-title">{t("dashboard.rh.recruitment.section.onboarding", "Onboarding RH")}</h2>
            <OnboardingPanel candidate={selected} onboarding={details.onboarding} />
          </section>
        </div>
      ) : selected ? (
        <p className="text-xs text-gray-500">
          {t("dashboard.rh.recruitment.detailsPartial", "Detail non charge pour ce candidat (liste limitee).")}
        </p>
      ) : null}

      <section className="card p-4">
        <h2 className="section-title mb-2">{t("dashboard.rh.recruitment.section.globalAlerts", "Alertes pipeline")}</h2>
        <RecruitmentAlertsPanel candidates={filtered} />
      </section>
    </div>
  );
}
