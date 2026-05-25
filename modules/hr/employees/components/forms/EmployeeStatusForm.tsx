"use client";

import { useState, useTransition } from "react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { updateEmployeeEmploymentStatusAction } from "@/modules/hr/employees/server/actions/employee-actions";

export function EmployeeStatusForm({
  employeeId,
  isActive,
}: {
  employeeId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { refreshAfterMutation } = useAppMutationRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-600">Statut d&apos;emploi</p>
      <p className="text-sm text-darktext">{isActive ? "Actif" : "Inactif"}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await updateEmployeeEmploymentStatusAction({
              employeeId,
              isActive: !isActive,
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setMessage(isActive ? "Collaborateur desactive." : "Collaborateur active.");
            refreshAfterMutation();
          });
        }}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-darktext hover:bg-gray-50 disabled:opacity-60"
      >
        {isActive ? "Desactiver" : "Reactiver"}
      </button>
      {message ? <p className="text-xs text-green-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
