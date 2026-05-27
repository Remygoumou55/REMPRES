"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import { KanbanCard } from "@/components/operations/KanbanCard";
import type { OpsTaskStatus } from "@/lib/constants/operations";

export type KanbanColumnProps = {
  status: OpsTaskStatus;
  label: string;
  color: { bg: string; text: string };
  tasks: OpsTask[];
  columnIndex: number;
  columnCount: number;
  onMoveLeft: (taskId: string) => void;
  onMoveRight: (taskId: string) => void;
  onEdit: (task: OpsTask) => void;
  onAddTask: (status: OpsTaskStatus) => void;
};

function KanbanColumnInner({
  status,
  label,
  color,
  tasks,
  columnIndex,
  columnCount,
  onMoveLeft,
  onMoveRight,
  onEdit,
  onAddTask,
}: KanbanColumnProps) {
  const isFirst = columnIndex === 0;
  const isLast = columnIndex === columnCount - 1;

  return (
    <div className="flex min-w-[240px] flex-col rounded-xl border border-gray-200 bg-[#FAFAF8]">
      <header className="flex items-center gap-2 border-b border-gray-200 px-3 py-3">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color.text }}
        />
        <h3 className="flex-1 text-sm font-bold text-darktext">{label}</h3>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {tasks.length} tâche{tasks.length !== 1 ? "s" : ""}
        </span>
      </header>

      <div className="flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/50 p-4 text-center text-xs text-gray-500">
            Aucune tâche
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              canMoveLeft={!isFirst}
              canMoveRight={!isLast && task.status !== "done"}
              onMoveLeft={() => onMoveLeft(task.id)}
              onMoveRight={() => onMoveRight(task.id)}
              onEdit={onEdit}
            />
          ))
        )}
      </div>

      <div className="border-t border-gray-200 p-2">
        <button
          type="button"
          onClick={() => onAddTask(status)}
          className="flex w-full items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Nouvelle tâche
        </button>
      </div>
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnInner);
