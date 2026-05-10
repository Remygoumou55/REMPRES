"use client";

import { useTransition } from "react";
import {
  enqueueAutomationEscalationSweepAction,
  enqueueAutomationScheduleSweepAction,
} from "@/modules/automation/server/actions/automation-sweep-actions";
import { useAutomationWorkspace } from "@/modules/automation/components/dashboard/AutomationWorkspaceProvider";

export function AutomationSweepToolbar() {
  const { canOperate } = useAutomationWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
      <span className="font-medium">Orchestration worker</span>
      <span className="text-amber-800">
        Enfile des jobs sur la queue infrastructure (<code className="rounded bg-white px-1">automation</code>
        ).
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueAutomationScheduleSweepAction();
          })
        }
      >
        Balayer planifications
      </button>
      <button
        type="button"
        disabled={pending}
        className="rounded-lg border border-gray-800 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueAutomationEscalationSweepAction();
          })
        }
      >
        Balayer SLA / escalades
      </button>
    </div>
  );
}
