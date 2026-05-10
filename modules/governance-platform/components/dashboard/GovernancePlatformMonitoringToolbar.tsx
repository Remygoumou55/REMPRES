"use client";

import { useTransition } from "react";
import { enqueueGovernancePlatformMaturityDigestAction } from "@/modules/governance-platform/server/actions/governance-platform-monitoring-actions";
import { useGovernancePlatformWorkspace } from "@/modules/governance-platform/components/dashboard/GovernancePlatformWorkspaceProvider";

export function GovernancePlatformMonitoringToolbar() {
  const { canOperate } = useGovernancePlatformWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/90 p-3 text-sm text-violet-950">
      <span className="font-medium">Digest maturité</span>
      <span className="text-violet-900">
        File <code className="rounded bg-white px-1">governance_platform</code> — job{" "}
        <code className="rounded bg-white px-1">governance_platform.maturity_digest</code> (ADR, board, standards,
        dette, snapshots ; journal append-only).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-violet-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueGovernancePlatformMaturityDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
