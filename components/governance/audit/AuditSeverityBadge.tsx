"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { GovernanceAuditSeverity } from "@/lib/governance/audit/types";

const STYLES: Record<GovernanceAuditSeverity, string> = {
  informational: "bg-gray-100 text-gray-700",
  warning: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
  security: "bg-violet-50 text-violet-700",
};

export function AuditSeverityBadge({ severity }: { severity: GovernanceAuditSeverity }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[severity]}`}>
      {t(`severity.${severity}`)}
    </span>
  );
}
