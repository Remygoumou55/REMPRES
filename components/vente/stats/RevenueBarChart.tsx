"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  data: {
    month_label: string;
    revenue_gnf: number;
    sale_count: number;
  }[];
};

function formatGnfAxis(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

function formatGnfFull(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} GNF`;
}

export const RevenueBarChart = memo(function RevenueBarChart({ data }: Props) {
  const hasData = data.some((d) => d.revenue_gnf > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center text-sm text-gray-500">
        Aucune vente sur la période sélectionnée.
      </div>
    );
  }

  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" vertical={false} />
          <XAxis dataKey="month_label" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={48} />
          <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={formatGnfAxis} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as Props["data"][number];
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-darktext">{label}</p>
                  <p className="mt-1 text-gray-600">CA : {formatGnfFull(row.revenue_gnf)}</p>
                  <p className="text-gray-500">Nombre de ventes : {row.sale_count}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="revenue_gnf" fill="#185FA5" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
