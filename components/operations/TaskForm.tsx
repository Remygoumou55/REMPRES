"use client";

import { memo, useState, useTransition } from "react";
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type OpsTaskPriority,
  type OpsTaskStatus,
} from "@/lib/constants/operations";
import type { OpsTask } from "@/lib/server/operations";
import {
  createTaskAction,
  updateTaskAction,
} from "@/app/(app)/operations/tasks/actions";
import {
  ModalActions,
  ModalError,
  ModalField,
  ModalInput,
  ModalSelect,
  ModalTextarea,
} from "@/components/ui/modal";

type Props = {
  task?: OpsTask | null;
  defaultStatus?: OpsTaskStatus;
  projects: { id: string; name: string }[];
  assignableUsers: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
};

function TaskFormInner({
  task,
  defaultStatus,
  projects,
  assignableUsers,
  onSuccess,
  onCancel,
}: Props) {
  const isEdit = Boolean(task?.id);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState<OpsTaskPriority>(
    task?.priority ?? "normal",
  );

  const priorityStyle = TASK_PRIORITY_COLORS[priority];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const result = isEdit
        ? await updateTaskAction(task!.id, fd)
        : await createTaskAction(fd);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ModalField label="Titre" required>
        <ModalInput
          name="title"
          required
          maxLength={200}
          defaultValue={task?.title ?? ""}
          placeholder="Intitulé de la tâche"
        />
      </ModalField>

      <ModalField label="Description">
        <ModalTextarea
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="Détails optionnels…"
        />
      </ModalField>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField label="Statut">
          <ModalSelect
            name="status"
            defaultValue={task?.status ?? defaultStatus ?? "todo"}
          >
            {(Object.keys(TASK_STATUS_LABELS) as OpsTaskStatus[]).map((k) => (
              <option key={k} value={k}>
                {TASK_STATUS_LABELS[k]}
              </option>
            ))}
          </ModalSelect>
        </ModalField>

        <ModalField label="Priorité">
          <div className="mb-1 flex justify-end">
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: priorityStyle.bg,
                color: priorityStyle.text,
              }}
            >
              {TASK_PRIORITY_LABELS[priority]}
            </span>
          </div>
          <ModalSelect
            name="priority"
            defaultValue={task?.priority ?? "normal"}
            onChange={(e) => setPriority(e.target.value as OpsTaskPriority)}
          >
            {(Object.keys(TASK_PRIORITY_LABELS) as OpsTaskPriority[]).map(
              (k) => (
                <option key={k} value={k}>
                  {TASK_PRIORITY_LABELS[k]}
                </option>
              ),
            )}
          </ModalSelect>
        </ModalField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField label="Projet">
          <ModalSelect
            name="project_id"
            defaultValue={task?.project_id ?? "none"}
          >
            <option value="none">Aucun projet</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </ModalSelect>
        </ModalField>

        <ModalField label="Assigné à">
          <ModalSelect
            name="assigned_to"
            defaultValue={task?.assigned_to ?? "none"}
          >
            <option value="none">Non assigné</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </ModalSelect>
        </ModalField>
      </div>

      <ModalField label="Date d'échéance">
        <ModalInput
          name="due_date"
          type="date"
          defaultValue={task?.due_date ?? ""}
        />
      </ModalField>

      <ModalError message={error} />
      <ModalActions
        loading={pending}
        onCancel={onCancel}
        submitLabel="Enregistrer"
      />
    </form>
  );
}

export const TaskForm = memo(TaskFormInner);
