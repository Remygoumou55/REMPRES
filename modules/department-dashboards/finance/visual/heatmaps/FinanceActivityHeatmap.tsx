"use client";

import { useTranslation } from "@/hooks/use-translation";
import type { FinanceVisualHeatmapCell } from "@/modules/department-dashboards/finance/visual/finalization";

function tone(value: number): string {
  if (value >= 6) return "bg-emerald-300/40";
  if (value >= 3) return "bg-emerald-200/40";
  if (value >= 1) return "bg-emerald-100/40";
  return "bg-gray-100";
}

export function FinanceActivityHeatmap({ cells }: { cells: FinanceVisualHeatmapCell[] }) {
  const { t } = useTranslation();
  return (
    <section className="card p-4">
      <h3 className="text-sm font-semibold text-darktext">{t("finance.visual.heatmap.title", "Financial heatmap")}</h3>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {cells.map((c) => (
          <div key={c.day} className={`rounded-lg border border-gray-200 p-2 text-center text-xs ${tone(c.value)}`}>
            <p className="font-semibold text-gray-700">{c.day}</p>
            <p className="mt-1 text-gray-600">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
