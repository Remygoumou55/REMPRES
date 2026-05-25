"use client";

import { useTransition } from "react";
import { transitionOpsWorkflowAction } from "@/modules/operations/server/actions/ops-actions";

const NEXT: Record<string, "active" | "review" | "approved" | "closed"> = {
  pending: "active",
  active: "review",
  review: "approved",
  approved: "closed",
};

export function OpsWorkflowTransitionButton({
  workflowId,
  status,
}: {
  workflowId: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  const target = NEXT[status];
  if (!target) return null;

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-50"
      onClick={() =>
        start(async () => {
          await transitionOpsWorkflowAction(workflowId, target);
        })
      }
    >
      → {target}
    </button>
  );
}
