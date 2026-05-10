"use client";

import { useTransition } from "react";
import { enqueueObservabilityHealthDigestAction } from "@/modules/observability/server/actions/observability-monitoring-actions";
import { useObservabilityWorkspace } from "@/modules/observability/components/dashboard/ObservabilityWorkspaceProvider";

export function ObservabilityMonitoringToolbar() {
  const { canOperate } = useObservabilityWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm text-sky-950">
      <span className="font-medium">Digest santé opérationnelle</span>
      <span className="text-sky-900">
        Agrège infrastructure jobs, risques conformité, runs automation et alertes gouvernance (
        <code className="rounded bg-white px-1">observability.health_digest</code>
        ).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueObservabilityHealthDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
