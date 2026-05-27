"use client";

import { memo, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_TRANSITIONS,
  type OpsTaskStatus,
} from "@/lib/constants/operations";
import { updateTaskStatusAction } from "@/app/(app)/operations/tasks/actions";

const TRANSITION_LABELS: Partial<Record<OpsTaskStatus, string>> = {
  in_progress: "Démarrer",
  done: "Terminer",
  blocked: "Pause",
  cancelled: "Annuler",
};

type Props = {
  taskId: string;
  currentStatus: OpsTaskStatus;
};

function TaskStatusButtonInner({ taskId, currentStatus }: Props) {
  const [pending, startTransition] = useTransition();
  const transitions = TASK_STATUS_TRANSITIONS[currentStatus] ?? [];
  const colors = TASK_STATUS_COLORS[currentStatus];

  const onTransition = (next: OpsTaskStatus) => {
    startTransition(async () => {
      await updateTaskStatusAction(taskId, next);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        {TASK_STATUS_LABELS[currentStatus]}
      </span>
      {transitions.length > 0 ? (
        <>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
          {transitions.map((next) => {
            const nextColors = TASK_STATUS_COLORS[next];
            return (
              <button
                key={next}
                type="button"
                disabled={pending}
                onClick={() => onTransition(next)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50"
                style={{ color: nextColors.text }}
              >
                {pending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : null}
                {TRANSITION_LABELS[next] ?? TASK_STATUS_LABELS[next]}
              </button>
            );
          })}
        </>
      ) : null}
    </div>
  );
}

export const TaskStatusButton = memo(TaskStatusButtonInner);
