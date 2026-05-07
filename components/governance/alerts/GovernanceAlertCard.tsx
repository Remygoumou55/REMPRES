"use client";

import type { GovernanceAlert } from "@/lib/governance/alerts/types";
import { AlertSeverityBadge } from "./AlertSeverityBadge";
import { AlertStatusBadge } from "./AlertStatusBadge";
import { AlertTimeline } from "./AlertTimeline";
import { useTranslation } from "@/hooks/use-translation";

export function GovernanceAlertCard({
  alert,
  actions,
}: {
  alert: GovernanceAlert;
  actions?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const title =
    typeof alert.metadata.title_key === "string" ? t(alert.metadata.title_key) : alert.title;
  const description =
    typeof alert.metadata.description_key === "string"
      ? t(alert.metadata.description_key)
      : alert.description;
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-1">
          <AlertSeverityBadge severity={alert.severity} />
          <AlertStatusBadge status={alert.lifecycleStatus} />
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      <p className="mt-1 text-xs text-gray-500">
        {t("governance.alerts.labels.department")}: {alert.departmentKey ?? t("governance.alerts.labels.global")} ·{" "}
        {t("governance.alerts.labels.type")}: {alert.type}
      </p>
      <div className="mt-2">
        <AlertTimeline createdAt={alert.createdAt} resolvedAt={alert.resolvedAt} />
      </div>
      {actions ? <div className="mt-3">{actions}</div> : null}
    </article>
  );
}
