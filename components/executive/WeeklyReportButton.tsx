"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { ChevronDown, FileText, Loader2 } from "lucide-react";
import { getWeeklyReportAction } from "@/app/(app)/executive/actions";
import { downloadWeeklyReport } from "@/components/executive/WeeklyReportPDF";

type Props = {
  currentWeek: number;
  currentYear: number;
};

function WeeklyReportButtonInner({ currentWeek, currentYear }: Props) {
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(currentWeek);
  const [year, setYear] = useState(currentYear);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const yearOptions = [currentYear, currentYear - 1];

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

  const runGenerate = useCallback(
    (w: number, y: number) => {
      setError(null);
      startTransition(async () => {
        const result = await getWeeklyReportAction(w, y);
        if (!result.success || !result.data) {
          setError(result.error ?? "Génération impossible.");
          return;
        }
        try {
          await downloadWeeklyReport(result.data);
          setOpen(false);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erreur PDF.");
        }
      });
    },
    [],
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm hover:bg-gray-50 transition"
        aria-expanded={open}
      >
        <FileText className="h-4 w-4 text-primary" />
        Rapport hebdo
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
          <p className="mb-3 text-xs font-medium text-gray-500">Période du rapport</p>
          <label className="mb-2 block text-xs text-gray-600">
            Semaine N°
            <input
              type="number"
              min={1}
              max={53}
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="input mt-1 w-full text-sm"
              disabled={pending}
            />
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
            onClick={() => runGenerate(week, year)}
            disabled={pending}
            className="btn-primary mb-2 flex w-full items-center justify-center gap-2 text-sm"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération…
              </>
            ) : (
              "Générer le PDF"
            )}
          </button>
          <button
            type="button"
            onClick={() => runGenerate(currentWeek, currentYear)}
            disabled={pending}
            className="btn-secondary w-full text-sm"
          >
            Cette semaine
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const WeeklyReportButton = memo(WeeklyReportButtonInner);
