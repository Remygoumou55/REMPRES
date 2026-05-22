"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type DomainMixPoint = { key: string; label: string; value: number };

type Props = {
  data: DomainMixPoint[];
  valueLabel?: string;
};

export function DomainMixChart({ data, valueLabel = "Indicateur" }: Props) {
  const hasData = useMemo(() => data.some((d) => d.value > 0), [data]);

  if (!hasData) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 text-center">
        <p className="text-sm font-medium text-gray-400">Aucune donnée agrégée par domaine</p>
        <p className="mt-1 max-w-xs px-4 text-xs text-gray-400">
          Les volumes apparaîtront lorsque les agrégations exécutives sont disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
          <YAxis tick={{ fontSize: 11 }} width={36} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as DomainMixPoint;
              const v = Number(payload[0].value);
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-darktext">{row.label}</p>
                  <p className="mt-1 text-gray-600">
                    {valueLabel} : {Number.isFinite(v) ? v.toLocaleString("fr-FR") : "—"}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="#2D7CC4" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
