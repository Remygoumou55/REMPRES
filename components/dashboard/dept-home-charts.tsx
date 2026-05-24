"use client";

import { memo, useMemo } from "react";
import type { ComponentProps } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/lib/server/dept-dashboard";

type DeptHomeChartsProps = {
  chart7Days: ChartPoint[];
  deptColor: string;
  barOnly?: boolean;
  lineOnly?: boolean;
};

function formatAxis(value: number): string {
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value.toLocaleString("fr-FR");
}

type TooltipFormatterProp = NonNullable<ComponentProps<typeof Tooltip>["formatter"]>;

const tooltipFormatter = (value: number | string) =>
  [`${Number(value ?? 0).toLocaleString("fr-FR")} GNF`, "Montant"] as [string, string];

const tooltipFormatterProp: TooltipFormatterProp = ((value) =>
  tooltipFormatter((value ?? 0) as number | string)) as TooltipFormatterProp;

export const DeptHomeCharts = memo(function DeptHomeCharts({
  chart7Days,
  deptColor,
  barOnly = false,
  lineOnly = false,
}: DeptHomeChartsProps) {
  const data = useMemo(
    () => chart7Days.map((p) => ({ label: p.date, value: p.value })),
    [chart7Days],
  );

  if (barOnly) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={formatAxis} />
          <Tooltip formatter={tooltipFormatterProp} />
          <Bar dataKey="value" fill={deptColor} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (lineOnly) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={formatAxis} />
          <Tooltip formatter={tooltipFormatterProp} />
          <Line type="monotone" dataKey="value" stroke={deptColor} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
});
