"use client";

import { useState, useTransition } from "react";
import type { EmployeeProfile } from "@/modules/hr/employees/types";
import { updateEmployeeManagerAction } from "@/modules/hr/employees/server/actions/employee-actions";

export function EmployeeManagerForm({
  employeeId,
  profiles,
  currentManagerId,
  departmentKey,
}: {
  employeeId: string;
  profiles: EmployeeProfile[];
  currentManagerId: string | null;
  departmentKey: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [managerId, setManagerId] = useState(currentManagerId ?? "");
  const [title, setTitle] = useState("");
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
          const result = await updateEmployeeManagerAction({
            employeeId,
            managerId: managerId || null,
            title: title || null,
            departmentKey,
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
          setMessage("Manager mis a jour.");
        });
      }}
    >
      <label className="block text-xs text-gray-500">
        Manager
        <select
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        >
          <option value="">Aucun</option>
          {profiles
            .filter((profile) => profile.id !== employeeId)
            .map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.fullName}
              </option>
            ))}
        </select>
      </label>
      <label className="block text-xs text-gray-500">
        Poste
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          placeholder="ex. Responsable equipe RH"
        />
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white">
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

