"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { ApprovalRequestStatus } from "@/lib/governance/approvals/types";

const STATUS_CLASS: Record<ApprovalRequestStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-gray-100 text-gray-700",
};

export function ApprovalStatusBadge({ status }: { status: ApprovalRequestStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}>
      {t(`status.${status}`)}
    </span>
  );
}
