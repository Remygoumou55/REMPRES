"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { GovernanceAlertLifecycleStatus } from "@/lib/governance/alerts/types";

const STATUS_STYLES: Record<GovernanceAlertLifecycleStatus, string> = {
  unread: "bg-blue-50 text-blue-700",
  acknowledged: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
  archived: "bg-slate-100 text-slate-700",
};

export function AlertStatusBadge({ status }: { status: GovernanceAlertLifecycleStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
