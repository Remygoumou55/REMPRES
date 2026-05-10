"use client";

import { useTransition } from "react";
import { enqueueCloudOperationsDigestAction } from "@/modules/cloud/server/actions/cloud-monitoring-actions";
import { useCloudWorkspace } from "@/modules/cloud/components/dashboard/CloudWorkspaceProvider";

export function CloudMonitoringToolbar() {
  const { canOperate } = useCloudWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50/90 p-3 text-sm text-indigo-950">
      <span className="font-medium">Orchestration cloud</span>
      <span className="text-indigo-900">
        File <code className="rounded bg-white px-1">cloud</code> — job{" "}
        <code className="rounded bg-white px-1">cloud.operations_digest</code> (agrégation régions / edge / workloads /
        DR, journal append-only).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-indigo-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueCloudOperationsDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
