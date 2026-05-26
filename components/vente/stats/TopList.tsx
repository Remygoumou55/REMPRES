"use client";

import { memo } from "react";

export type TopListItem = {
  id: string;
  name: string;
  subtitle?: string | null;
  value: number;
  count: number;
  maxValue: number;
};

type Props = {
  title: string;
  items: TopListItem[];
  valueLabel: string;
  countLabel: string;
  emptyText: string;
};

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

const RANK_STYLES = [
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-slate-100 text-slate-700 border-slate-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-blue-50 text-blue-800 border-blue-200",
  "bg-blue-50 text-blue-700 border-blue-200",
];

export const TopList = memo(function TopList({
  title,
  items,
  valueLabel,
  countLabel,
  emptyText,
}: Props) {
  const maxValue = items[0]?.maxValue ?? 1;

  return (
    <section className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-darktext">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item, index) => {
            const pct = maxValue > 0 ? Math.min(100, (item.value / maxValue) * 100) : 0;
            const rankStyle = RANK_STYLES[index] ?? RANK_STYLES[4];
            return (
              <li key={item.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${rankStyle}`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-darktext">{item.name}</p>
                    {item.subtitle ? (
                      <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-primary">{formatGnf(item.value)}</p>
                    <span className="mt-0.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {item.count} {countLabel}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#185FA5] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">{valueLabel}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
});
