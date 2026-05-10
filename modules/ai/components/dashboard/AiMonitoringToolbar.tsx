"use client";

import { useTransition } from "react";
import { enqueueAiInsightPipelineAction } from "@/modules/ai/server/actions/ai-monitoring-actions";
import { useAiWorkspace } from "@/modules/ai/components/dashboard/AiWorkspaceProvider";

export function AiMonitoringToolbar() {
  const { canOperate } = useAiWorkspace();
  const [pending, start] = useTransition();

  if (!canOperate) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 p-3 text-sm text-violet-950">
      <span className="font-medium">Pipeline insights</span>
      <span className="text-violet-900">
        Agrège observabilité, conformité, automation et files (
        <code className="rounded bg-white px-1">ai.insight_pipeline</code>
        ). Heuristique — branchable LLM/ML sans changer les tables append-only.
      </span>
      <button
        type="button"
        disabled={pending}
        className="ml-auto rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        onClick={() =>
          start(async () => {
            await enqueueAiInsightPipelineAction();
          })
        }
      >
        Enfiler pipeline
      </button>
    </div>
  );
}
