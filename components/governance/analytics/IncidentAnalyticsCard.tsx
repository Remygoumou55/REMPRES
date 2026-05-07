"use client";

import { useTranslation } from "@/hooks/use-translation";

export function IncidentAnalyticsCard({
  unresolvedAlerts,
  securityEvents7d,
}: {
  unresolvedAlerts: number;
  securityEvents7d: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.analytics.incidents.title")}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t("governance.analytics.incidents.unresolved")}: <strong>{unresolvedAlerts}</strong> ·{" "}
        {t("governance.analytics.incidents.security7d")}:{" "}
        <strong>{securityEvents7d}</strong>
      </p>
    </section>
  );
}
