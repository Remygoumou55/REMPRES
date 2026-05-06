"use client";

import { memo } from "react";

export const CategoryBar = memo(function CategoryBar({
  rows,
  fmt,
}: {
  rows: { categoryId: string; name: string; color: string; amount: number }[];
  fmt: (key: string, amountGnf: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center text-sm text-gray-400">
        Aucune dépense sur la période.
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pct = Math.max((r.amount / max) * 100, 4);
        return (
          <li key={r.categoryId} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-darktext">{r.name}</span>
              <span className="tabular-nums font-mono text-gray-600">{fmt(`cat:${r.categoryId}`, r.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: r.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
});
