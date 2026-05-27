"use client";

import { memo, useTransition } from "react";
import Link from "next/link";
import { Download, Edit, Loader2 } from "lucide-react";
import { getReconciliationForPDFAction } from "@/app/(app)/finance/rapprochement/actions";
import { downloadReconciliationPDF } from "@/components/finance/ReconciliationPDF";
import {
  getDiscrepancyColor,
  type BankReconciliation,
} from "@/lib/finance/bank-reconciliation-types";
import { formatGNF } from "@/lib/utils/formatCurrency";

type Props = {
  history: BankReconciliation[];
  activeId: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  validated: "Validé",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-800",
  validated: "bg-emerald-100 text-emerald-800",
};

function ReconciliationHistoryInner({ history, activeId }: Props) {
  const [pending, startTransition] = useTransition();

  const downloadPdf = (id: string) => {
    startTransition(async () => {
      const result = await getReconciliationForPDFAction(id);
      if (!result.success || !result.data) return;
      await downloadReconciliationPDF(
        result.data,
        result.userName ?? "Responsable Finance",
      );
    });
  };

  if (history.length === 0) {
    return (
      <section className="card p-6 text-center text-sm text-gray-500">
        Aucun rapprochement enregistré.
      </section>
    );
  }

  return (
    <section className="card overflow-x-auto">
      <h2 className="border-b px-4 py-3 text-base font-semibold text-darktext">
        Historique des rapprochements
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-500">
            <th className="p-3">Période</th>
            <th className="p-3 text-right">Solde système</th>
            <th className="p-3 text-right">Solde banque</th>
            <th className="p-3 text-right">Écart</th>
            <th className="p-3">Statut</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => {
            const colors = getDiscrepancyColor(row.discrepancy_gnf);
            const isActive = row.id === activeId;
            return (
              <tr
                key={row.id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  isActive ? "bg-primary/5" : ""
                }`}
              >
                <td className="p-3 font-medium">{row.period_label}</td>
                <td className="p-3 text-right tabular-nums">
                  {formatGNF(row.system_balance_gnf)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {row.bank_balance_gnf != null
                    ? formatGNF(row.bank_balance_gnf)
                    : "—"}
                </td>
                <td className="p-3 text-right">
                  {row.discrepancy_gnf != null ? (
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {formatGNF(row.discrepancy_gnf)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[row.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {row.status !== "validated" ? (
                      <Link
                        href={`/finance/rapprochement?month=${row.month}&year=${row.year}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Modifier
                      </Link>
                    ) : null}
                    {row.bank_balance_gnf != null ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => downloadPdf(row.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-primary disabled:opacity-50"
                      >
                        {pending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        PDF
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export const ReconciliationHistory = memo(ReconciliationHistoryInner);
