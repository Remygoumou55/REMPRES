"use client";

import { memo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = {
  data: {
    category: string;
    revenue_gnf: number;
    percentage: number;
  }[];
};

const SLICE_COLORS = ["#185FA5", "#2D7CC4", "#3FA9D6", "#1D9E75", "#639922", "#BA7517"];

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export const CategoryPieChart = memo(function CategoryPieChart({ data }: Props) {
  const hasData = data.some((d) => d.revenue_gnf > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center text-sm text-gray-500">
        Aucune répartition par catégorie disponible.
      </div>
    );
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue_gnf"
            nameKey="category"
            cx="50%"
            cy="45%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as Props["data"][number];
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-darktext">{row.category}</p>
                  <p className="mt-1 text-gray-600">{formatGnf(row.revenue_gnf)}</p>
                  <p className="text-gray-500">{row.percentage} %</p>
                </div>
              );
            }}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value, entry) => {
              const pct = (entry.payload as Props["data"][number] | undefined)?.percentage;
              return `${value} (${pct ?? 0} %)`;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
