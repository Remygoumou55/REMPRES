"use client";

import { useTransition } from "react";
import { enqueueComplianceRiskScanAction } from "@/modules/compliance/server/actions/compliance-monitoring-actions";
import { useComplianceWorkspace } from "@/modules/compliance/components/dashboard/ComplianceWorkspaceProvider";

export function ComplianceMonitoringToolbar() {
  const { canOperate } = useComplianceWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-950">
      <span className="font-medium">Monitoring conformité</span>
      <span className="text-emerald-900">
        Scan risques sur les brouillons journal intersectant verrous fiscaux / périodes closes (
        <code className="rounded bg-white px-1">compliance.risk_scan</code>).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueComplianceRiskScanAction();
          })
        }
      >
        Lancer scan risques
      </button>
    </div>
  );
}
