"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";
import type { OpsTask } from "@/lib/server/operations";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  type OpsTaskPriority,
} from "@/lib/constants/operations";
import { TaskForm } from "@/components/operations/TaskForm";
import { TaskStatusButton } from "@/components/operations/TaskStatusButton";
import { deleteTaskAction } from "@/app/(app)/operations/tasks/actions";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-danger-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";

type Summary = {
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
};

type Props = {
  tasks: OpsTask[];
  projects: { id: string; name: string }[];
  assignableUsers: { id: string; full_name: string }[];
  summary: Summary;
};

function PriorityBadge({ priority }: { priority: OpsTaskPriority }) {
  const c = TASK_PRIORITY_COLORS[priority];
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}

function OperationsTasksClientInner({
  tasks,
  projects,
  assignableUsers,
  summary,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpsTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }
      if (projectFilter !== "all" && t.project_id !== projectFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, projectFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
  };

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (task: OpsTask) => {
    setEditing(task);
    setModalOpen(true);
  };

  const onFormSuccess = () => {
    setModalOpen(false);
    setEditing(null);
    router.refresh();
  };

  const onDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      setActionError(null);
      const result = await deleteTaskAction(deleteId);
      if (!result.success) {
        setActionError(result.error ?? "Suppression impossible.");
        return;
      }
      setDeleteId(null);
      router.refresh();
    });
  };

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Tâches"
        subtitle="Backlog opérationnel : priorités, assignation, échéances et transitions de statut."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouvelle tâche
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-[#F1EFE8] px-3 py-1 text-[#444441]">
          {summary.todo} à faire
        </span>
        <span className="rounded-full bg-[#FAEEDA] px-3 py-1 text-[#633806]">
          {summary.in_progress} en cours
        </span>
        <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[#27500A]">
          {summary.done} terminées
        </span>
        <span
          className={`rounded-full px-3 py-1 ${
            summary.overdue > 0
              ? "bg-[#FCEBEB] text-[#791F1F]"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {summary.overdue} en retard
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Statut
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="blocked">En pause</option>
            <option value="done">Terminé</option>
            <option value="cancelled">Annulé</option>
          </Select>
        </div>
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Priorité
          </label>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Toutes</option>
            <option value="low">Basse</option>
            <option value="normal">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </Select>
        </div>
        <div className="min-w-[160px] flex-1">
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
        <Button type="button" variant="secondary" onClick={clearFilters}>
          Effacer les filtres
        </Button>
      </div>

      {actionError ? (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <OperationsSectionPanel title="Liste des tâches">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <ClipboardList className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600">Aucune tâche</p>
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle tâche
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="border-b px-3 py-2 font-medium">Priorité</th>
                  <th className="border-b px-3 py-2 font-medium">Titre</th>
                  <th className="border-b px-3 py-2 font-medium">Projet</th>
                  <th className="border-b px-3 py-2 font-medium">Assigné à</th>
                  <th className="border-b px-3 py-2 font-medium">Statut</th>
                  <th className="border-b px-3 py-2 font-medium">Échéance</th>
                  <th className="border-b px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-100 hover:bg-gray-50/80"
                  >
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{t.title}</div>
                      {t.description ? (
                        <div className="line-clamp-1 text-xs text-gray-500">
                          {t.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {t.project_name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {t.assigned_name ?? "Non assigné"}
                    </td>
                    <td className="px-3 py-2.5">
                      <TaskStatusButton
                        taskId={t.id}
                        currentStatus={t.status}
                      />
                    </td>
                    <td
                      className={`px-3 py-2.5 text-xs ${
                        t.is_overdue
                          ? "font-medium text-red-600"
                          : t.due_date
                            ? "text-emerald-700"
                            : "text-gray-400"
                      }`}
                    >
                      {t.due_date ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(t.id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OperationsSectionPanel>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Modifier la tâche" : "Nouvelle tâche"}
        size="lg"
      >
        <TaskForm
          task={editing}
          projects={projects}
          assignableUsers={assignableUsers}
          onSuccess={onFormSuccess}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={pending}
        title="Supprimer cette tâche ?"
        message="La tâche sera archivée (suppression logique)."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export const OperationsTasksClient = memo(OperationsTasksClientInner);
