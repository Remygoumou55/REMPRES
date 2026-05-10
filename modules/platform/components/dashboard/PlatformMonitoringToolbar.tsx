"use client";

import { useTransition } from "react";
import { enqueuePlatformRegistryDigestAction } from "@/modules/platform/server/actions/platform-monitoring-actions";
import { usePlatformWorkspace } from "@/modules/platform/components/dashboard/PlatformWorkspaceProvider";

export function PlatformMonitoringToolbar() {
  const { canOperate } = usePlatformWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50/80 p-3 text-sm text-cyan-950">
      <span className="font-medium">Digest registre</span>
      <span className="text-cyan-900">
        File <code className="rounded bg-white px-1">platform</code> —{" "}
        <code className="rounded bg-white px-1">platform.registry_digest</code> (agrège catalogue / installations pour
        observabilité et extensions futures).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueuePlatformRegistryDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
