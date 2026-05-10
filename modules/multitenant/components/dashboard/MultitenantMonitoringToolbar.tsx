"use client";

import { useTransition } from "react";
import { enqueueMultitenantSweepAction } from "@/modules/multitenant/server/actions/multitenant-monitoring-actions";
import { useMultitenantWorkspace } from "@/modules/multitenant/components/dashboard/MultitenantWorkspaceProvider";

export function MultitenantMonitoringToolbar() {
  const { canOperate } = useMultitenantWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-950">
      <span className="font-medium">Orchestration SaaS</span>
      <span className="text-emerald-900">
        File dédiée <code className="rounded bg-white px-1">multitenant</code> — job{" "}
        <code className="rounded bg-white px-1">multitenant.orchestration_sweep</code> (extension quotas /
        observabilité sans refactor métier).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueMultitenantSweepAction();
          })
        }
      >
        Enfiler sweep
      </button>
    </div>
  );
}
