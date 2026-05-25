"use client";

import { useTransition } from "react";
import {
  completeOpsTaskAction,
  updateOpsTaskStatusAction,
} from "@/modules/operations/server/actions/ops-actions";

export function OpsTaskRowActions({
  taskId,
  status,
}: {
  taskId: string;
  status: string;
}) {
  const [pending, start] = useTransition();

  if (status === "done" || status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "todo" ? (
        <button
          type="button"
          disabled={pending}
          className="rounded border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50"
          onClick={() =>
            start(async () => {
              await updateOpsTaskStatusAction(taskId, "in_progress");
            })
          }
        >
          Démarrer
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
        onClick={() =>
          start(async () => {
            await completeOpsTaskAction(taskId);
          })
        }
      >
        Clôturer
      </button>
    </div>
  );
}
