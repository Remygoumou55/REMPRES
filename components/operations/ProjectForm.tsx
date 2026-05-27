"use client";

import { memo, useState, useTransition } from "react";
import {
  PROJECT_STATUS_LABELS,
  type OpsProjectStatus,
} from "@/lib/constants/operations";
import type { OpsProject } from "@/lib/server/operations";
import {
  createProjectAction,
  updateProjectAction,
} from "@/app/(app)/operations/projects/actions";
import {
  ModalActions,
  ModalError,
  ModalField,
  ModalInput,
  ModalSelect,
  ModalTextarea,
} from "@/components/ui/modal";

type Props = {
  project?: OpsProject | null;
  assignableUsers: { id: string; full_name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
};

function ProjectFormInner({
  project,
  assignableUsers,
  onSuccess,
  onCancel,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setError(null);
      const result = project
        ? await updateProjectAction(project.id, fd)
        : await createProjectAction(fd);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ModalField label="Nom" required>
        <ModalInput
          name="name"
          required
          maxLength={200}
          defaultValue={project?.name ?? ""}
        />
      </ModalField>

      <ModalField label="Description">
        <ModalTextarea
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
        />
      </ModalField>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField label="Statut">
          <ModalSelect
            name="status"
            defaultValue={project?.status ?? "active"}
          >
            {(Object.keys(PROJECT_STATUS_LABELS) as OpsProjectStatus[]).map(
              (k) => (
                <option key={k} value={k}>
                  {PROJECT_STATUS_LABELS[k]}
                </option>
              ),
            )}
          </ModalSelect>
        </ModalField>

        <ModalField label="Responsable">
          <ModalSelect
            name="manager_id"
            defaultValue={project?.manager_id ?? "none"}
          >
            <option value="none">—</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </ModalSelect>
        </ModalField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModalField label="Date début">
          <ModalInput
            name="start_date"
            type="date"
            defaultValue={project?.start_date ?? ""}
          />
        </ModalField>
        <ModalField label="Date fin">
          <ModalInput
            name="end_date"
            type="date"
            defaultValue={project?.end_date ?? ""}
          />
        </ModalField>
      </div>

      <ModalField label="Budget (GNF)">
        <ModalInput
          name="budget_gnf"
          type="number"
          min={0}
          step={1}
          defaultValue={
            project?.budget_gnf != null ? String(project.budget_gnf) : ""
          }
          placeholder="Montant en francs guinéens"
        />
      </ModalField>

      <ModalField label="Référence budget">
        <ModalInput
          name="budget_reference"
          defaultValue={project?.budget_reference ?? ""}
          placeholder="Code ou libellé interne"
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

export const ProjectForm = memo(ProjectFormInner);
