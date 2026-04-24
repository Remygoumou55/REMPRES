"use client";

import type { DayStats } from "@/lib/server/dashboard-kpis";
import { formatGNF } from "@/lib/utils/formatCurrency";

type Props = { data: DayStats[] };

/**
 * Graphique 7 jours (barres CSS) — extrait pour chargement dynamique optionnel.
 */
export function SalesChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  const today = new Date().toISOString().slice(0, 10);
  const allEmpty = data.every((d) => d.amount === 0);

  if (allEmpty) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
        <p className="text-sm font-medium text-gray-400">Aucun chiffre sur les 7 derniers jours</p>
        <p className="mt-1 text-xs text-gray-300">Les ventes apparaîtront ici automatiquement.</p>
      </div>
    );
  }

  return (
    <div className="flex h-36 items-end gap-1.5">
      {data.map((d) => {
        const pct     = Math.max((d.amount / max) * 100, 4);
        const isToday = d.date === today;
        return (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-1">
            <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl border border-gray-100 bg-white px-2.5 py-1.5 text-center opacity-0 shadow-lg transition-all group-hover:opacity-100">
              <p className="text-xs font-bold text-darktext">{formatGNF(d.amount)}</p>
              <p className="text-[10px] text-gray-400">
                {d.count} vente{d.count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="relative w-full" style={{ height: "112px" }}>
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-t-xl transition-all duration-500 ${
                  isToday
                    ? "bg-primary shadow-sm shadow-primary/30"
                    : d.amount > 0
                    ? "bg-primary/25 group-hover:bg-primary/40"
                    : "bg-gray-100"
                }`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span
              className={`text-[10px] font-medium ${
                isToday ? "text-primary" : "text-gray-400"
              }`}
            >
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
