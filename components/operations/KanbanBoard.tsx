"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import {
  TASK_STATUS_COLORS,
  type OpsTaskStatus,
} from "@/lib/constants/operations";
import { updateTaskStatusAction } from "@/app/(app)/operations/tasks/actions";
import { KanbanColumn } from "@/components/operations/KanbanColumn";
import { TaskForm } from "@/components/operations/TaskForm";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const KANBAN_COLUMNS: { status: OpsTaskStatus; label: string }[] = [
  { status: "todo", label: "À faire" },
  { status: "in_progress", label: "En cours" },
  { status: "blocked", label: "En pause" },
  { status: "done", label: "Terminé" },
];

export type KanbanBoardProps = {
  initialTasks: OpsTask[];
  projects: { id: string; name: string }[];
  assignableUsers: { id: string; full_name: string }[];
};

function KanbanBoardInner({
  initialTasks,
  projects,
  assignableUsers,
}: KanbanBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tasks, setTasks] = useState<OpsTask[]>(initialTasks);
  const [projectFilter, setProjectFilter] = useState("all");
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);
  const [createStatus, setCreateStatus] = useState<OpsTaskStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "cancelled") return false;
      if (projectFilter !== "all" && t.project_id !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, projectFilter]);

  const moveTask = useCallback(
    (taskId: string, newStatus: OpsTaskStatus) => {
      setTasks((prev) => {
        const snapshot = prev;
        const optimistic = prev.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t,
        );
        startTransition(async () => {
          const result = await updateTaskStatusAction(taskId, newStatus);
          if (!result.success) {
            setTasks(snapshot);
            return;
          }
          router.refresh();
        });
        return optimistic;
      });
    },
    [router],
  );

  const columnHandlers = useMemo(() => {
    return KANBAN_COLUMNS.map((col, i) => ({
      ...col,
      onMoveLeft: (taskId: string) => {
        if (i > 0) moveTask(taskId, KANBAN_COLUMNS[i - 1]!.status);
      },
      onMoveRight: (taskId: string) => {
        if (i < KANBAN_COLUMNS.length - 1) {
          moveTask(taskId, KANBAN_COLUMNS[i + 1]!.status);
        }
      },
    }));
  }, [moveTask]);

  const openCreate = (status: OpsTaskStatus) => {
    setEditingTask(null);
    setCreateStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task: OpsTask) => {
    setEditingTask(task);
    setCreateStatus(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setCreateStatus(null);
  };

  const onFormSuccess = () => {
    closeModal();
    router.refresh();
  };

  const hasAnyKanbanTask = tasks.some((t) => t.status !== "cancelled");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Projet
          </label>
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">Tous les projets</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!hasAnyKanbanTask ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <ClipboardList className="h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-600">Aucune tâche</p>
          <Button type="button" onClick={() => openCreate("todo")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Créer la première tâche
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div
            className="grid min-w-[1000px] gap-3"
            style={{
              gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(220px, 1fr))`,
            }}
          >
            {columnHandlers.map((col, i) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={TASK_STATUS_COLORS[col.status]}
                tasks={visibleTasks.filter((t) => t.status === col.status)}
                columnIndex={i}
                columnCount={KANBAN_COLUMNS.length}
                onMoveLeft={col.onMoveLeft}
                onMoveRight={col.onMoveRight}
                onEdit={openEdit}
                onAddTask={openCreate}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Les tâches annulées sont visibles depuis la vue Liste.
      </p>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
        size="lg"
      >
        <TaskForm
          task={editingTask}
          defaultStatus={createStatus ?? undefined}
          projects={projects}
          assignableUsers={assignableUsers}
          onSuccess={onFormSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
}

export const KanbanBoard = memo(KanbanBoardInner);
