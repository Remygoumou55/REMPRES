"use client";

import { memo, useTransition } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
} from "@/lib/constants/operations";

export type KanbanCardProps = {
  task: OpsTask;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onEdit: (task: OpsTask) => void;
};

function formatDueShort(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.toLocaleDateString("fr-FR", { day: "numeric" });
  const month = d.toLocaleDateString("fr-FR", { month: "short" });
  const capMonth = month.charAt(0).toUpperCase() + month.slice(1).replace(/\.$/, "");
  return `${day} ${capMonth}`;
}

function assigneeInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function KanbanCardInner({
  task,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  onEdit,
}: KanbanCardProps) {
  const [pending, startTransition] = useTransition();
  const priorityStyle = TASK_PRIORITY_COLORS[task.priority];
  const isDone = task.status === "done";
  const isUrgent = task.priority === "urgent";
  const accentBorder =
    task.is_overdue || isUrgent ? "border-l-[3px] border-l-[#E24B4A]" : "border-l border-l-transparent";

  const runMove = (fn: () => void) => {
    startTransition(() => {
      fn();
    });
  };

  return (
    <article
      className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${accentBorder} ${
        isDone ? "opacity-70" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: priorityStyle.bg,
            color: priorityStyle.text,
          }}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Modifier"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <h4 className="line-clamp-2 text-[13px] font-bold leading-snug text-darktext">
        {task.title}
      </h4>

      {task.description ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-gray-500">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        {task.due_date ? (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              task.is_overdue ? "font-medium text-[#E24B4A]" : "text-gray-500"
            }`}
          >
            {task.is_overdue ? (
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
            )}
            <span>{formatDueShort(task.due_date)}</span>
          </div>
        ) : (
          <span />
        )}

        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
            task.assigned_name
              ? "bg-[#E6F1FB] text-[#0C447C]"
              : "bg-gray-100 text-gray-400"
          }`}
          title={task.assigned_name ?? "Non assigné"}
        >
          {assigneeInitials(task.assigned_name)}
        </span>
      </div>

      {(canMoveLeft || canMoveRight) && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-2">
          {canMoveLeft ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => runMove(onMoveLeft)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Gauche
            </button>
          ) : null}
          {canMoveRight ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => runMove(onMoveRight)}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Droite
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}

export const KanbanCard = memo(KanbanCardInner);
