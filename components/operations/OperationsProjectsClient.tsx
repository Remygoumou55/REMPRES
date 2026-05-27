"use client";

import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";
import type { OpsProject } from "@/lib/server/operations";
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  type OpsProjectStatus,
} from "@/lib/constants/operations";
import { ProjectForm } from "@/components/operations/ProjectForm";
import { deleteProjectAction } from "@/app/(app)/operations/projects/actions";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-danger-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";
import { formatCurrency } from "@/utils/currency";

type Props = {
  projects: OpsProject[];
  assignableUsers: { id: string; full_name: string }[];
};

function StatusBadge({ status }: { status: OpsProjectStatus }) {
  const c = PROJECT_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

function TaskProgress({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="text-xs text-gray-600">
        {done}/{total} tâches
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OperationsProjectsClientInner({
  projects,
  assignableUsers,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OpsProject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (project: OpsProject) => {
    setEditing(project);
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
      const result = await deleteProjectAction(deleteId);
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
        title="Projets"
        subtitle="Portefeuille projets : responsable, budget, dates et avancement des tâches."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nouveau projet
          </Button>
        }
      />

      {actionError ? (
        <p className="text-sm text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}

      <OperationsSectionPanel title="Portefeuille projets">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <FolderKanban className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-600">Aucun projet</p>
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nouveau projet
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="border-b px-3 py-2 font-medium">Nom</th>
                  <th className="border-b px-3 py-2 font-medium">Statut</th>
                  <th className="border-b px-3 py-2 font-medium">Responsable</th>
                  <th className="border-b px-3 py-2 font-medium">Tâches</th>
                  <th className="border-b px-3 py-2 font-medium">Dates</th>
                  <th className="border-b px-3 py-2 font-medium">Budget</th>
                  <th className="border-b px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50/80"
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{p.name}</div>
                      {p.description ? (
                        <div className="line-clamp-1 text-xs text-gray-500">
                          {p.description}
                        </div>
                      ) : null}
                      <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                        {p.project_code}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      {p.manager_name ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <TaskProgress
                        done={p.completed_task_count}
                        total={p.task_count}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {p.start_date ?? "—"} → {p.end_date ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      {p.budget_gnf != null
                        ? formatCurrency(p.budget_gnf, "GNF")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(p.id)}
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
        title={editing ? "Modifier le projet" : "Nouveau projet"}
        size="lg"
      >
        <ProjectForm
          project={editing}
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
        title="Supprimer ce projet ?"
        message="Le projet sera archivé (suppression logique)."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export const OperationsProjectsClient = memo(OperationsProjectsClientInner);
