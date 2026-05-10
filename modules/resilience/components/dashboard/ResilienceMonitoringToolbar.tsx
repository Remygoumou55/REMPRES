"use client";

import { useTransition } from "react";
import { enqueueResilienceReliabilityDigestAction } from "@/modules/resilience/server/actions/resilience-monitoring-actions";
import { useResilienceWorkspace } from "@/modules/resilience/components/dashboard/ResilienceWorkspaceProvider";

export function ResilienceMonitoringToolbar() {
  const { canOperate } = useResilienceWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950">
      <span className="font-medium">Digest résilience</span>
      <span className="text-amber-900">
        File <code className="rounded bg-white px-1">resilience</code> — job{" "}
        <code className="rounded bg-white px-1">resilience.reliability_digest</code> (agrège scénarios, runs, métriques ;
        journal append-only).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueResilienceReliabilityDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
