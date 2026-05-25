"use client";

import { useState, useTransition } from "react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { submitRhLeaveRequestAction } from "../actions";

type EmployeeOption = { id: string; label: string };

export function RhLeavesClient({ employees }: { employees: EmployeeOption[] }) {
  const [pending, startTransition] = useTransition();
  const { refreshAfterMutation } = useAppMutationRefresh();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const result = await submitRhLeaveRequestAction({
            employeeId: String(formData.get("employeeId") ?? ""),
            leaveType: String(formData.get("leaveType") ?? ""),
            startDate: String(formData.get("startDate") ?? ""),
            endDate: String(formData.get("endDate") ?? ""),
            reason: String(formData.get("reason") ?? ""),
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
          setMessage("Demande de conge enregistree.");
          (event.currentTarget as HTMLFormElement).reset();
          refreshAfterMutation();
        });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Collaborateur</label>
          <select
            name="employeeId"
            required
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Selectionner...
            </option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Type</label>
          <select name="leaveType" required className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option value="annual">Conge annuel</option>
            <option value="sick">Conge maladie</option>
            <option value="special">Conge special</option>
            <option value="unpaid">Conge sans solde</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Debut</label>
          <input name="startDate" type="date" required className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Fin</label>
          <input name="endDate" type="date" required className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Motif</label>
        <textarea
          name="reason"
          required
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Motif de la demande"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Soumettre la demande"}
      </button>
    </form>
  );
}

