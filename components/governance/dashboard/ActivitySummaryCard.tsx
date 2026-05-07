"use client";

import { useTranslation } from "@/hooks/use-translation";

type ActivitySummaryCardProps = {
  activityEvents24h: number;
  activeUsers: number;
};

export function ActivitySummaryCard({
  activityEvents24h,
  activeUsers,
}: ActivitySummaryCardProps) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.dashboard.activitySummary.title")}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t("governance.dashboard.activitySummary.eventsPrefix")} {activityEvents24h} ·{" "}
        {activeUsers} {t("governance.dashboard.activitySummary.activeUsersSuffix")}
      </p>
    </section>
  );
}
