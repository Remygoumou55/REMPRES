"use client";

import { useMemo, useState, memo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart } from "lucide-react";
import { formatAmount, type Currency } from "@/lib/currencyService";
import type { FinanceDayPoint } from "@/lib/server/finance-overview";
import {
  toRevenueExpenseChartRows,
  type FinanceProjectionDay,
  type RevExpChartRow,
  DEFAULT_PROJECTION_HORIZON,
} from "@/lib/finance-forecast";
import { useCurrencyBatchConversion } from "@/hooks/useCurrencyConversion";

export type ChartMode = "7d" | "range";

export const ChartBlockRevenueExpense = memo(function ChartBlockRevenueExpense({
  mode,
  onModeChange,
  baseRange,
  base7d,
  forecastNextDays,
  currency,
}: {
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  baseRange: FinanceDayPoint[];
  base7d: FinanceDayPoint[];
  forecastNextDays: FinanceProjectionDay[];
  currency: Currency;
}) {
  const series = mode === "7d" ? base7d : baseRange;
  const withForecast: RevExpChartRow[] = useMemo(() => {
    if (mode === "7d") {
      return toRevenueExpenseChartRows(series, []);
    }
    return toRevenueExpenseChartRows(baseRange, forecastNextDays);
  }, [mode, series, baseRange, forecastNextDays]);

  const chartData = useMemo(
    () =>
      withForecast.map((d) => ({
        ...d,
        labelShort: d.label,
      })),
    [withForecast],
  );
  const chartItems = useMemo(
    () =>
      chartData.flatMap((d) => [
        { key: `${d.date}:revenue`, amount: d.revenue },
        { key: `${d.date}:expenses`, amount: d.expenses },
        ...(d.revProj == null ? [] : [{ key: `${d.date}:revProj`, amount: d.revProj }]),
        ...(d.expProj == null ? [] : [{ key: `${d.date}:expProj`, amount: d.expProj }]),
      ]),
    [chartData],
  );
  const {
    convertedByKey: convertedChart,
    hasUnavailable: chartConversionUnavailable,
    loading: chartConvLoading,
  } = useCurrencyBatchConversion(chartItems, "GNF", currency);
  const convertedChartData = useMemo(
    () =>
      chartData.map((d) => ({
        ...d,
        revenue: convertedChart[`${d.date}:revenue`] ?? 0,
        expenses: convertedChart[`${d.date}:expenses`] ?? 0,
        revProj: d.revProj == null ? null : (convertedChart[`${d.date}:revProj`] ?? 0),
        expProj: d.expProj == null ? null : (convertedChart[`${d.date}:expProj`] ?? 0),
      })),
    [chartData, convertedChart],
  );

  const fmtY = (v: number) => formatAmount(v, currency);
  const empty =
    convertedChartData.length === 0 ||
    convertedChartData.every((d) => d.revenue === 0 && d.expenses === 0 && !d.revProj);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-darktext">Revenus vs dépenses</h2>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => onModeChange("7d")}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "7d" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            7 jours
          </button>
          <button
            type="button"
            onClick={() => onModeChange("range")}
            className={`rounded-lg px-3 py-1.5 transition ${
              mode === "range" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Période filtrée
          </button>
        </div>
      </div>
      {mode === "range" && forecastNextDays.length > 0 && (
        <p className="mb-2 text-xs text-gray-500">
          Prévision (pointillés) : tendance linéaire + moyenne sur l’historique de la période — {DEFAULT_PROJECTION_HORIZON} j. après la fin de plage (indicatif).
        </p>
      )}
      {chartConvLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
          <p className="text-sm font-medium text-gray-400">Conversion des montants…</p>
        </div>
      ) : chartConversionUnavailable ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/50 text-center">
          <p className="text-sm font-medium text-amber-700">Conversion indisponible</p>
        </div>
      ) : empty ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
          <p className="text-sm font-medium text-gray-400">Aucune donnée sur la plage affichée</p>
        </div>
      ) : (
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={convertedChartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
              <XAxis
                dataKey="labelShort"
                tick={{ fontSize: 10, fill: "#64748b" }}
                interval={0}
                angle={convertedChartData.length > 12 ? -35 : 0}
                textAnchor={convertedChartData.length > 12 ? "end" : "middle"}
                height={convertedChartData.length > 12 ? 70 : 28}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(v) => (currency === "GNF" ? (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1000)}k`) : fmtY(v))}
              />
              <Tooltip
                formatter={(value, name) => {
                  const n =
                    name === "revenue"
                      ? "Revenus"
                      : name === "expenses"
                        ? "Dépenses"
                        : name === "revProj"
                          ? "Revenus (prév.)"
                          : "Dépenses (prév.)";
                  return [value == null ? "—" : fmtY(Number(value)), n];
                }}
                labelFormatter={(_, p) => (p?.[0]?.payload as { date?: string })?.date ?? ""}
                contentStyle={{ borderRadius: "12px" }}
              />
              <Legend
                formatter={(v) =>
                  v === "revenue"
                    ? "Revenus"
                    : v === "expenses"
                      ? "Dépenses"
                      : v === "revProj"
                        ? "Revenus (prév.)"
                        : "Dépenses (prév.)"
                }
              />
              <Bar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="expenses" name="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              {mode === "range" && forecastNextDays.length > 0 && (
                <>
                  <Line
                    type="monotone"
                    dataKey="revProj"
                    name="revProj"
                    stroke="#047857"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 4"
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="expProj"
                    name="expProj"
                    stroke="#be123c"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="6 4"
                    connectNulls
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
});

export const CashflowChart = memo(function CashflowChart({
  points,
  currency,
}: {
  points: FinanceDayPoint[];
  currency: Currency;
}) {
  const fmt = (v: number) => formatAmount(v, currency);
  const chartData = useMemo(() => {
    const safe = Array.isArray(points) ? points : [];
    return safe.map((p) => ({
      ...p,
      labelShort: p.label,
    }));
  }, [points]);
  const cashItems = useMemo(
    () =>
      chartData.flatMap((d) => [
        { key: `${d.date}:cashIn`, amount: d.cashIn },
        { key: `${d.date}:cashOut`, amount: d.cashOut },
        { key: `${d.date}:net`, amount: d.net },
        { key: `${d.date}:cumulative`, amount: d.cumulative },
      ]),
    [chartData],
  );
  const {
    convertedByKey: convertedCash,
    hasUnavailable: cashConversionUnavailable,
    loading: cashConvLoading,
  } = useCurrencyBatchConversion(cashItems, "GNF", currency);
  const convertedCashData = useMemo(
    () =>
      chartData.map((d) => ({
        ...d,
        cashIn: convertedCash[`${d.date}:cashIn`] ?? 0,
        cashOut: convertedCash[`${d.date}:cashOut`] ?? 0,
        net: convertedCash[`${d.date}:net`] ?? 0,
        cumulative: convertedCash[`${d.date}:cumulative`] ?? 0,
      })),
    [chartData, convertedCash],
  );
  const empty =
    convertedCashData.length === 0 ||
    convertedCashData.every((d) => d.cashIn === 0 && d.cashOut === 0);
  if (cashConvLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
        <p className="text-sm font-medium text-gray-400">Conversion des montants…</p>
      </div>
    );
  }
  if (cashConversionUnavailable) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/50 text-center">
        <p className="text-sm text-amber-700">Conversion indisponible</p>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
        <p className="text-sm text-gray-400">Aucun flux sur la période</p>
      </div>
    );
  }
  return (
    <div className="h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={convertedCashData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis
            dataKey="labelShort"
            tick={{ fontSize: 10, fill: "#64748b" }}
            interval={0}
            angle={convertedCashData.length > 10 ? -35 : 0}
            textAnchor={convertedCashData.length > 10 ? "end" : "middle"}
            height={convertedCashData.length > 10 ? 64 : 28}
          />
          <YAxis
            yAxisId="l"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickFormatter={(v) => fmt(v)}
          />
          <YAxis
            yAxisId="r"
            orientation="right"
            tick={{ fontSize: 10, fill: "#2563eb" }}
            tickFormatter={(v) => fmt(v)}
          />
          <Tooltip
            formatter={(value, name) => {
              const n = name === "cashIn" ? "Entrées" : name === "cashOut" ? "Sorties" : "Cumul net";
              return [fmt(Number(value ?? 0)), n];
            }}
            contentStyle={{ borderRadius: "12px" }}
          />
          <Legend />
          <Bar yAxisId="l" dataKey="cashIn" name="Entrées" fill="#10b981" maxBarSize={32} />
          <Bar yAxisId="l" dataKey="cashOut" name="Sorties" fill="#f43f5e" maxBarSize={32} />
          <Line
            yAxisId="r"
            type="monotone"
            dataKey="cumulative"
            name="Cumul net"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
});
