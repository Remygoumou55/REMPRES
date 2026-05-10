"use client";

import { useState, useTransition } from "react";
import { updateEmployeeRoleAssignmentAction } from "@/modules/hr/employees/server/actions/employee-actions";

export function EmployeeRoleForm({
  employeeId,
  initialRoleKey,
  initialDepartmentKey,
}: {
  employeeId: string;
  initialRoleKey: string;
  initialDepartmentKey: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [roleKey, setRoleKey] = useState(initialRoleKey);
  const [departmentKey, setDepartmentKey] = useState(initialDepartmentKey ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await updateEmployeeRoleAssignmentAction({
            employeeId,
            roleKey,
            departmentKey: departmentKey || null,
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
          setMessage("Role/departement mis a jour.");
        });
      }}
    >
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-xs text-gray-500">
          Role
          <input
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-gray-500">
          Departement
          <input
            value={departmentKey}
            onChange={(e) => setDepartmentKey(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

