"use client";

import { memo, useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { getWeeklyReportAction } from "@/app/(app)/executive/actions";
import { downloadWeeklyReport } from "@/components/executive/WeeklyReportPDF";
import { formatWeekRangeLabel } from "@/lib/executive/week-utils";

type Props = {
  currentWeek: number;
  currentYear: number;
  recentWeeks: { week: number; year: number }[];
};

function WeeklyReportPageClientInner({
  currentWeek,
  currentYear,
  recentWeeks,
}: Props) {
  const [week, setWeek] = useState(currentWeek);
  const [year, setYear] = useState(currentYear);
  const [error, setError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const yearOptions = [currentYear, currentYear - 1];

  const generate = useCallback(async (w: number, y: number, key?: string) => {
    setError(null);
    if (key) setRowBusy(key);
    const result = await getWeeklyReportAction(w, y);
    if (!result.success || !result.data) {
      setError(result.error ?? "Génération impossible.");
      setRowBusy(null);
      return;
    }
    try {
      await downloadWeeklyReport(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur PDF.");
    } finally {
      setRowBusy(null);
    }
  }, []);

  const handleMain = () => {
    startTransition(() => generate(week, year));
  };

  const handleCurrentWeek = () => {
    startTransition(() => generate(currentWeek, currentYear));
  };

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="mb-4 text-base font-semibold text-darktext">
          Générer un rapport
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-sm text-gray-600">
            Semaine N°
            <input
              type="number"
              min={1}
              max={53}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="input mt-1 block w-24"
              disabled={pending}
            />
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
            onClick={handleMain}
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
                Générer le PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCurrentWeek}
            disabled={pending || rowBusy !== null}
            className="btn-secondary text-sm"
          >
            Cette semaine
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
          Historique — 4 dernières semaines
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="p-3">Semaine</th>
              <th className="p-3">Période</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {recentWeeks.map((row) => {
              const key = `${row.year}-${row.week}`;
              const busy = rowBusy === key;
              return (
                <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium">S{row.week}</td>
                  <td className="p-3 text-gray-600">
                    {formatWeekRangeLabel(row.week, row.year)}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={busy || pending}
                      onClick={() => generate(row.week, row.year, key)}
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

      <p className="text-center text-sm text-gray-500">
        <Link href="/dashboard/executive" className="text-primary hover:underline">
          Retour au centre exécutif →
        </Link>
      </p>
    </div>
  );
}

export const WeeklyReportPageClient = memo(WeeklyReportPageClientInner);
