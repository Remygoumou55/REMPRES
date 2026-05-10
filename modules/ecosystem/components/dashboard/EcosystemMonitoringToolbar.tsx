"use client";

import { useTransition } from "react";
import { enqueueEcosystemFederationDigestAction } from "@/modules/ecosystem/server/actions/ecosystem-monitoring-actions";
import { useEcosystemWorkspace } from "@/modules/ecosystem/components/dashboard/EcosystemWorkspaceProvider";

export function EcosystemMonitoringToolbar() {
  const { canOperate } = useEcosystemWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
      <span className="font-medium">Digest fédération</span>
      <span className="text-amber-900">
        File <code className="rounded bg-white px-1">ecosystem</code> —{" "}
        <code className="rounded bg-white px-1">ecosystem.federation_digest</code>
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueEcosystemFederationDigestAction();
          })
        }
      >
        Enfiler digest
      </button>
    </div>
  );
}
