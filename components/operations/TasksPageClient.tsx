"use client";

import { memo, useState, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import { KanbanBoard } from "@/components/operations/KanbanBoard";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";

export type TasksPageClientProps = {
  tasks: OpsTask[];
  projects: { id: string; name: string }[];
  assignableUsers: { id: string; full_name: string }[];
  listView: ReactNode;
};

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
      role="group"
      aria-label="Mode d'affichage"
    >
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
          view === "list"
            ? "bg-primary text-white"
            : "bg-white text-gray-600 hover:bg-gray-50",
        )}
      >
        <List className="h-4 w-4" />
        Liste
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        className={cn(
          "flex items-center gap-1.5 border-l border-gray-200 px-3 py-2 text-xs font-medium transition",
          view === "kanban"
            ? "bg-primary text-white"
            : "bg-white text-gray-600 hover:bg-gray-50",
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Kanban
      </button>
    </div>
  );
}

function TasksPageClientInner({
  tasks,
  projects,
  assignableUsers,
  listView,
}: TasksPageClientProps) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute z-30",
          view === "list"
            ? "right-4 top-[4.25rem] sm:right-6"
            : "right-4 top-6 sm:right-6",
        )}
      >
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "list" ? (
        listView
      ) : (
        <div className="page-wrapper space-y-6">
          <div className="pr-36 sm:pr-44">
            <h1 className="text-2xl font-bold text-darktext">Tâches</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vue Kanban — déplacez les tâches avec les boutons Gauche / Droite.
            </p>
          </div>
          <KanbanBoard
            initialTasks={tasks}
            projects={projects}
            assignableUsers={assignableUsers}
          />
        </div>
      )}
    </div>
  );
}

export const TasksPageClient = memo(TasksPageClientInner);
