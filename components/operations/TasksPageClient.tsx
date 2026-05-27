"use client";

import { memo, useMemo, useState, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import { KanbanBoard } from "@/components/operations/KanbanBoard";
import { normalizeRealtimeOpsTasks } from "@/components/operations/mapRealtimeOpsTask";
import { useRealtimeList } from "@/hooks/useRealtimeList";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "kanban";

export type TasksPageClientProps = {
  initialTasks: OpsTask[];
  projects: { id: string; name: string }[];
  assignableUsers: { id: string; full_name: string }[];
  listView: ReactNode;
};

function LiveBadge() {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        fontSize: 11,
        color: "#1D9E75",
        padding: "2px 8px",
        borderRadius: 999,
        background: "#EAF3DE",
        border: "0.5px solid #C0DD97",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#1D9E75",
        }}
        aria-hidden
      />
      En direct
    </span>
  );
}

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
  initialTasks,
  projects,
  assignableUsers,
  listView,
}: TasksPageClientProps) {
  const [view, setView] = useState<ViewMode>("list");

  const { data: rawTasks, isLive } = useRealtimeList<OpsTask>({
    table: "erp_ops_tasks",
    initialData: initialTasks,
    mode: "optimistic",
  });

  const tasks = useMemo(
    () => normalizeRealtimeOpsTasks(rawTasks as object[], initialTasks),
    [rawTasks, initialTasks],
  );

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute z-30 flex items-center gap-2",
          view === "list"
            ? "right-4 top-[4.25rem] sm:right-6"
            : "right-4 top-6 sm:right-6",
        )}
      >
        {isLive ? <LiveBadge /> : null}
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "list" ? (
        <>
          {listView}
          {isLive ? (
            <p className="page-wrapper -mt-4 pb-2 text-center text-xs text-gray-500">
              La vue liste se rafraîchit via le bouton de rechargement ou la
              navigation. Utilisez la vue Kanban pour les mises à jour en direct.
            </p>
          ) : null}
        </>
      ) : (
        <div className="page-wrapper space-y-6">
          <div className="pr-44 sm:pr-52">
            <h1 className="text-2xl font-bold text-darktext">Tâches</h1>
            <p className="mt-1 text-sm text-gray-600">
              Vue Kanban — déplacez les tâches avec les boutons Gauche / Droite.
            </p>
          </div>
          <KanbanBoard
            tasks={tasks}
            projects={projects}
            assignableUsers={assignableUsers}
          />
        </div>
      )}
    </div>
  );
}

export const TasksPageClient = memo(TasksPageClientInner);
