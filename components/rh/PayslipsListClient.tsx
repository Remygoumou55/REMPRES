"use client";

import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Loader2 } from "lucide-react";
import type { Payslip } from "@/lib/server/payslips";
import type { Employee } from "@/lib/types/rh";
import { deletePayslipAction } from "@/app/(app)/rh/fiches-de-paie/actions";

const MONTHS: Record<number, string> = {
  1: "Janvier", 2: "Février", 3: "Mars", 4: "Avril",
  5: "Mai", 6: "Juin", 7: "Juillet", 8: "Août",
  9: "Septembre", 10: "Octobre", 11: "Novembre", 12: "Décembre",
};

function fmtGNF(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

type Props = {
  payslips: Payslip[];
  employees: Employee[];
  initialEmployeeId: string;
  initialYear: string;
};

export const PayslipsListClient = memo(function PayslipsListClient({
  payslips,
  employees,
  initialEmployeeId,
  initialYear,
}: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId);
  const [year, setYear] = useState(initialYear);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function applyFilters(newEmployeeId: string, newYear: string) {
    const params = new URLSearchParams();
    if (newEmployeeId) params.set("employeeId", newEmployeeId);
    if (newYear) params.set("year", newYear);
    router.push(`/rh/fiches-de-paie${params.size ? `?${params.toString()}` : ""}`);
  }

  async function handleDownload(ps: Payslip) {
    const emp = ps.employee;
    if (!emp) return;
    const { downloadPayslipPDF } = await import("@/components/rh/PayslipPDF");
    await downloadPayslipPDF(ps, {
      id: ps.employee_id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      position: emp.position ?? "",
      department: emp.department ?? "",
      contract_type: "cdi",
      hire_date: "",
      salary_gnf: ps.salary_gnf,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette fiche de paie ?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deletePayslipAction(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select
          className="input max-w-xs"
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            applyFilters(e.target.value, year);
          }}
        >
          <option value="">Tous les employés</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.first_name} {e.last_name}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[160px]"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            applyFilters(employeeId, e.target.value);
          }}
        >
          <option value="">Toutes les années</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {payslips.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          Aucune fiche de paie pour ces critères.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Employé</th>
                <th className="p-3">Poste</th>
                <th className="p-3">Mois</th>
                <th className="p-3">Année</th>
                <th className="p-3 text-right">Salaire brut</th>
                <th className="p-3 text-right">Net à payer</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((ps) => {
                const emp = ps.employee;
                const isDeleting = deletingId === ps.id || isPending;
                return (
                  <tr key={ps.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium text-darktext">
                      {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                    </td>
                    <td className="p-3 text-gray-600">{emp?.position ?? "—"}</td>
                    <td className="p-3">{MONTHS[ps.month] ?? ps.month}</td>
                    <td className="p-3">{ps.year}</td>
                    <td className="p-3 text-right">{fmtGNF(ps.salary_gnf)}</td>
                    <td className="p-3 text-right font-semibold text-primary">
                      {fmtGNF(ps.net_salary_gnf)}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(ps)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          title="Télécharger PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ps.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          title="Supprimer"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
