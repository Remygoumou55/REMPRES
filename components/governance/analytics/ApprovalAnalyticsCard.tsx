"use client";

import { useTranslation } from "@/hooks/use-translation";

export function ApprovalAnalyticsCard({
  pendingApprovals,
  criticalEvents7d,
}: {
  pendingApprovals: number;
  criticalEvents7d: number;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("governance.analytics.approvals.title")}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t("governance.analytics.approvals.pending")}: <strong>{pendingApprovals}</strong> ·{" "}
        {t("governance.analytics.approvals.critical7d")}:{" "}
        <strong>{criticalEvents7d}</strong>
      </p>
    </section>
  );
}
