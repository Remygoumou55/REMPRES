"use client";

import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, Loader2, FileText } from "lucide-react";
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
  employee: Pick<Employee, "id" | "first_name" | "last_name" | "position" | "department" | "contract_type" | "hire_date" | "salary_gnf">;
};

export const EmployeePayslipsTab = memo(function EmployeePayslipsTab({ payslips, employee }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDownload(ps: Payslip) {
    const { downloadPayslipPDF } = await import("@/components/rh/PayslipPDF");
    await downloadPayslipPDF(ps, {
      id: employee.id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      position: employee.position,
      department: employee.department,
      contract_type: employee.contract_type,
      hire_date: employee.hire_date,
      salary_gnf: Number(employee.salary_gnf ?? 0),
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette fiche de paie ?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deletePayslipAction(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  if (payslips.length === 0) {
    return (
      <section className="card flex flex-col items-center gap-3 p-10 text-center text-gray-500">
        <FileText className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium">Aucune fiche générée</p>
        <p className="text-xs text-gray-400">Utilisez le formulaire ci-dessus pour générer un bulletin.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Fiches générées</h3>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="p-3">Mois</th>
              <th className="p-3">Année</th>
              <th className="p-3 text-right">Salaire</th>
              <th className="p-3 text-right">Net</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((ps) => {
              const isDeleting = deletingId === ps.id || isPending;
              return (
                <tr key={ps.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ps.id)}
                        disabled={isDeleting}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
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
    </section>
  );
});
