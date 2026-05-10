"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { createContractAction } from "@/modules/hr/contracts/server/actions/contract-actions";

export function ContractCreateForm({ onCreated }: { onCreated?: () => void }) {
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [employeeId, setEmployeeId] = useState("");
  const [contractType, setContractType] = useState("cdi");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [title, setTitle] = useState("");
  const [salaryGnf, setSalaryGnf] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-2 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createContractAction({
            employeeId,
            contractType,
            startDate,
            endDate: endDate || null,
            salaryGnf: salaryGnf ? Number(salaryGnf) : null,
            title: title || null,
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
          setEmployeeId("");
          setTitle("");
          setSalaryGnf("");
          onCreated?.();
        });
      }}
    >
      <input
        value={employeeId}
        onChange={(e) => setEmployeeId(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.contracts.form.employeeId", "ID collaborateur")}
        required
      />
      <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
        <option value="cdi">CDI</option>
        <option value="cdd">CDD</option>
        <option value="internship">Internship</option>
        <option value="consulting">Consulting</option>
        <option value="temporary">Temporary</option>
      </select>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" required />
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.contracts.form.title", "Intitule du poste")}
      />
      <input
        value={salaryGnf}
        onChange={(e) => setSalaryGnf(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.contracts.form.salary", "Salaire (GNF)")}
      />
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white md:col-span-2">
        {pending ? t("dashboard.rh.contracts.form.pending", "Creation...") : t("dashboard.rh.contracts.form.submit", "Creer contrat")}
      </button>
      {error ? <p className="text-xs text-red-600 md:col-span-2">{error}</p> : null}
    </form>
  );
}
