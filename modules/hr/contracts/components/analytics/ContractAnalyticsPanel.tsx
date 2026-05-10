"use client";

import { useTranslation } from "@/hooks/use-translation";

export function ContractAnalyticsPanel({
  metrics,
}: {
  metrics: { total: number; active: number; renewalDue: number; expired: number };
}) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-2 md:grid-cols-4">
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.contracts.analytics.total", "Total")}: {metrics.total}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.contracts.analytics.active", "Actifs")}: {metrics.active}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.contracts.analytics.renewal", "Renouvellement")}: {metrics.renewalDue}
      </div>
      <div className="rounded-xl border border-gray-200 p-2 text-xs">
        {t("dashboard.rh.contracts.analytics.expired", "Expires")}: {metrics.expired}
      </div>
    </div>
  );
}
