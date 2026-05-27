"use client";

import { memo, useCallback, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { getMonthlyReportAction } from "@/app/(app)/finance/actions";
import { downloadMonthlyReport } from "@/components/finance/MonthlyReportPDF";
import { formatGNF } from "@/lib/utils/formatCurrency";

const MONTH_OPTIONS = [
  { value: 1, label: "Janvier" },
  { value: 2, label: "Février" },
  { value: 3, label: "Mars" },
  { value: 4, label: "Avril" },
  { value: 5, label: "Mai" },
  { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" },
  { value: 8, label: "Août" },
  { value: 9, label: "Septembre" },
  { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Décembre" },
] as const;

export type MonthlySummaryRow = {
  month: number;
  year: number;
  label: string;
  revenue_gnf: number;
  expenses_gnf: number;
  net_gnf: number;
};

type Props = {
  summaries: MonthlySummaryRow[];
};

function MonthlyBilansClientInner({ summaries }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  const downloadFor = useCallback(async (m: number, y: number, key?: string) => {
    setError(null);
    if (key) setRowBusy(key);
    const result = await getMonthlyReportAction(m, y);
    if (!result.success || !result.data) {
      setError(result.error ?? "Génération impossible.");
      setRowBusy(null);
      return;
    }
    try {
      await downloadMonthlyReport(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF.");
    } finally {
      setRowBusy(null);
    }
  }, []);

  const handleMainGenerate = () => {
    startTransition(() => downloadFor(month, year));
  };

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-darktext">
          Générer un bilan
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm text-gray-600">
            Mois
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input mt-1 block min-w-[160px]"
              disabled={pending}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600">
            Année
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input mt-1 block min-w-[120px]"
              disabled={pending}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleMainGenerate}
            disabled={pending || rowBusy !== null}
            className="btn-primary inline-flex items-center gap-2"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Générer et télécharger
              </>
            )}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="border-b px-4 py-3 text-base font-semibold text-darktext">
          Historique — 6 derniers mois
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Mois</th>
              <th className="p-3 text-right">Revenus</th>
              <th className="p-3 text-right">Dépenses</th>
              <th className="p-3 text-right">Résultat</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((row) => {
              const key = `${row.year}-${row.month}`;
              const busy = rowBusy === key;
              return (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">{row.label}</td>
                  <td className="p-3 text-right tabular-nums">
                    {formatGNF(row.revenue_gnf)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {formatGNF(row.expenses_gnf)}
                  </td>
                  <td
                    className={`p-3 text-right tabular-nums font-medium ${
                      row.net_gnf >= 0 ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatGNF(row.net_gnf)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={busy || pending}
                      onClick={() => downloadFor(row.month, row.year, key)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Télécharger
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export const MonthlyBilansClient = memo(MonthlyBilansClientInner);
