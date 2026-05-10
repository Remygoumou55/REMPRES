"use client";

import { useTranslation } from "@/hooks/use-translation";

export function RecruitmentAnalyticsPanel({
  metrics,
}: {
  metrics: {
    total: number;
    activePipeline: number;
    pendingHire: number;
    hired: number;
    byStage: Record<string, number>;
  };
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.recruitment.metrics.total", "Candidats")}: {metrics.total}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.recruitment.metrics.pipeline", "Pipeline actif")}: {metrics.activePipeline}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.recruitment.metrics.pendingHire", "Embauches en validation")}: {metrics.pendingHire}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.recruitment.metrics.hired", "Embauchés")}: {metrics.hired}
      </div>
      <div className="md:col-span-4 rounded-xl border border-gray-100 p-2 text-[10px] text-gray-600">
        {Object.entries(metrics.byStage)
          .map(([k, v]) => `${k}:${v}`)
          .join(" · ")}
      </div>
    </div>
  );
}
