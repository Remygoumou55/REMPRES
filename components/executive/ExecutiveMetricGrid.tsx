"use client";

import { memo } from "react";

type Metric = {
  label: string;
  value: string | number;
};

export const ExecutiveMetricGrid = memo(function ExecutiveMetricGrid({
  items,
  columns = 3,
}: {
  items: readonly Metric[];
  columns?: 2 | 3 | 4;
}) {
  const cols =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-3";

  return (
    <div className={`grid ${cols} gap-3`}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 truncate">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-900 tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
});

