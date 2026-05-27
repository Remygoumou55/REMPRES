"use client";

import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, FileText, Loader2 } from "lucide-react";
import { getMonthlyReportAction } from "@/app/(app)/finance/actions";
import { downloadMonthlyReport } from "@/components/finance/MonthlyReportPDF";

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

function MonthlyReportButtonInner() {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const yearOptions = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const handleGenerate = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await getMonthlyReportAction(month, year);
      if (!result.success || !result.data) {
        setError(result.error ?? "Génération impossible.");
        return;
      }
      try {
        await downloadMonthlyReport(result.data);
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur PDF.");
      }
    });
  }, [month, year]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm hover:bg-gray-50 transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FileText className="h-4 w-4 text-primary" />
        Bilan mensuel
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-3 text-xs font-medium text-gray-500">Période du bilan</p>
          <label className="mb-2 block text-xs text-gray-600">
            Mois
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input mt-1 w-full text-sm"
              disabled={pending}
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="mb-3 block text-xs text-gray-600">
            Année
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input mt-1 w-full text-sm"
              disabled={pending}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="mb-2 text-xs text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              "Générer le PDF"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const MonthlyReportButton = memo(MonthlyReportButtonInner);
