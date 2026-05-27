"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatGnfCompact,
  type LinearRegressionResult,
  type MonthlyDataPoint,
} from "@/lib/utils/forecast";

type Stats = {
  total_12m: number;
  avg_monthly: number;
  best_month: MonthlyDataPoint | null;
  worst_month: MonthlyDataPoint | null;
};

type Props = {
  historicalMonths: MonthlyDataPoint[];
  forecastMonths: MonthlyDataPoint[];
  regression: LinearRegressionResult;
  trend: { label: string; color: string };
  reliability: string;
  stats: Stats;
};

function formatGnfFull(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  valueColor?: string;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="mt-0.5 rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
          className="mt-1 truncate text-lg font-bold tabular-nums"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </p>
        {sub ? <p className="mt-0.5 text-xs text-gray-400">{sub}</p> : null}
      </div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const isForecast = payload[0]?.dataKey === "forecast_gnf";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md text-xs">
      <p className="mb-1 font-semibold text-gray-800">
        {label} {isForecast ? "— Prévision" : "— Réel"}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="tabular-nums text-gray-600">
          {p.name}: {formatGnfFull(p.value)}
        </p>
      ))}
    </div>
  );
}

function ForecastPageClientInner({
  historicalMonths,
  forecastMonths,
  regression,
  trend,
  reliability,
  stats,
}: Props) {
  const hasData = historicalMonths.filter((m) => m.revenue_gnf > 0).length >= 3;
  const lastHistorical = historicalMonths[historicalMonths.length - 1]?.revenue_gnf ?? 0;

  const chartData = useMemo(() => {
    const allPoints = [...historicalMonths, ...forecastMonths];
    const n = allPoints.length;
    return allPoints.map((pt, i) => {
      const trendVal = Math.max(
        0,
        Math.round(regression.slope * (i + 1) + regression.intercept),
      );
      return {
        month_label: pt.month_label,
        real_gnf: pt.is_forecast ? undefined : pt.revenue_gnf,
        forecast_gnf: pt.is_forecast ? pt.revenue_gnf : undefined,
        trend_gnf: trendVal,
        is_forecast: pt.is_forecast,
        _n: n,
      };
    });
  }, [historicalMonths, forecastMonths, regression]);

  const separatorLabel =
    historicalMonths.length > 0
      ? historicalMonths[historicalMonths.length - 1]!.month_label
      : undefined;

  if (!hasData) {
    return (
      <div className="card flex flex-col items-center gap-4 p-16 text-center">
        <TrendingUp className="h-14 w-14 text-gray-200" />
        <p className="text-lg font-semibold text-darktext">Données insuffisantes</p>
        <p className="max-w-sm text-sm text-gray-500">
          Il faut au moins 3 mois de données de ventes pour calculer des
          prévisions fiables.
        </p>
        <Link
          href="/vente"
          className="btn-primary mt-2 inline-flex items-center gap-2 text-sm"
        >
          Aller à la Vente
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="CA total 12 mois"
          value={formatGnfCompact(stats.total_12m)}
          sub={formatGnfFull(stats.total_12m)}
          icon={TrendingUp}
        />
        <KpiCard
          label="Moyenne mensuelle"
          value={formatGnfCompact(stats.avg_monthly)}
          sub={formatGnfFull(stats.avg_monthly)}
          icon={BarChart2}
        />
        <KpiCard
          label="Tendance"
          value={trend.label}
          sub={`${formatGnfCompact(Math.abs(regression.slope))} / mois`}
          icon={regression.slope >= 0 ? TrendingUp : TrendingDown}
          valueColor={trend.color}
        />
        <KpiCard
          label="Fiabilité modèle"
          value={reliability}
          sub={`R² = ${regression.r_squared}`}
          icon={Activity}
        />
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-semibold text-darktext">
          Historique &amp; Prévisions
        </h2>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="month_label"
              tick={{ fontSize: 10, fill: "#6B7280" }}
              angle={-30}
              textAnchor="end"
            />
            <YAxis
              tickFormatter={(v) => formatGnfCompact(v as number)}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              width={72}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            />
            {separatorLabel ? (
              <ReferenceLine
                x={separatorLabel}
                stroke="#E24B4A"
                strokeDasharray="4 4"
                label={{
                  value: "Aujourd'hui",
                  position: "top",
                  fontSize: 9,
                  fill: "#E24B4A",
                }}
              />
            ) : null}
            <Bar dataKey="real_gnf" name="CA réel" fill="#185FA5" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.is_forecast ? "#1D9E75" : "#185FA5"}
                  fillOpacity={entry.is_forecast ? 0.75 : 1}
                />
              ))}
            </Bar>
            <Bar
              dataKey="forecast_gnf"
              name="Prévision"
              fill="#1D9E75"
              fillOpacity={0.75}
              strokeDasharray="4 4"
              radius={[2, 2, 0, 0]}
            />
            <Line
              dataKey="trend_gnf"
              name="Tendance"
              stroke="#EF9F27"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast table */}
      {forecastMonths.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="border-b px-4 py-3 text-base font-semibold text-darktext">
            Prévisions détaillées
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">Mois</th>
                <th className="p-3 text-right">Prévision CA</th>
                <th className="p-3 text-right">vs mois précédent</th>
                <th className="p-3">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {forecastMonths.map((m, i) => {
                const prev =
                  i === 0
                    ? lastHistorical
                    : forecastMonths[i - 1]!.revenue_gnf;
                const pct =
                  prev > 0 ? ((m.revenue_gnf - prev) / prev) * 100 : null;
                const comment =
                  regression.slope > 0
                    ? "Croissance attendue"
                    : regression.slope === 0
                      ? "Stabilité attendue"
                      : "Prudence conseillée";
                return (
                  <tr key={m.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-medium">{m.month_label}</td>
                    <td className="p-3 text-right tabular-nums font-semibold text-emerald-700">
                      {formatGnfFull(m.revenue_gnf)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {pct != null ? (
                        <span
                          className={
                            pct >= 0
                              ? "text-emerald-700"
                              : "text-red-600"
                          }
                        >
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(1)} %
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-gray-500">{comment}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Methodology note */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
        <strong className="text-gray-700">Méthodologie :</strong> Régression
        linéaire sur {historicalMonths.length} mois de données. R² ={" "}
        {regression.r_squared} ({reliability}). Ces prévisions sont indicatives et
        basées sur la tendance historique uniquement. Des facteurs externes
        (saisonnalité, marché) ne sont pas modélisés.
      </div>
    </div>
  );
}

export const ForecastPageClient = memo(ForecastPageClientInner);
