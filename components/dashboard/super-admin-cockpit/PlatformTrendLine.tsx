"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayStats } from "@/lib/server/dashboard-kpis";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatCurrency } from "@/utils/currency";
import { useCurrencyBatchConversion } from "@/hooks/useCurrencyConversion";

type Props = { data: DayStats[] };

export function PlatformTrendLine({ data }: Props) {
  const currency = useCurrencyStore((s) => s.selectedCurrency);
  const chartData = useMemo(
    () => data.map((d) => ({ label: d.label, net: d.amount, count: d.count })),
    [data],
  );
  const { convertedByKey, loading } = useCurrencyBatchConversion(
    chartData.map((d) => ({ key: d.label, amount: d.net })),
    "GNF",
    currency,
  );

  const allEmpty = useMemo(() => chartData.every((d) => d.net === 0), [chartData]);

  if (allEmpty) {
    return (
      <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/40 text-center">
        <p className="text-sm font-medium text-gray-400">Pas encore de tendance CA sur 7 jours</p>
      </div>
    );
  }

  return (
    <div className="h-52 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={44} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const lab = String(label ?? "");
              const net = Number(payload[0].value);
              const conv = convertedByKey[lab];
              const display =
                loading || conv === undefined
                  ? "…"
                  : conv === null
                    ? `${net.toLocaleString("fr-FR")} GNF`
                    : formatCurrency(conv, currency);
              const row = chartData.find((c) => c.label === lab);
              return (
                <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-darktext">{lab}</p>
                  <p className="mt-1 text-gray-600">CA net : {display}</p>
                  {row ? <p className="text-gray-500">Ventes : {row.count}</p> : null}
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="net" stroke="#0E4A8A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
