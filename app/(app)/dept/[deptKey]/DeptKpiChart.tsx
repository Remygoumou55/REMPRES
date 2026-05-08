"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import type { DeptKpiChart as DeptKpiChartType } from "@/lib/dept/kpi-contract";

export function DeptKpiChart({
  chart,
  emptyMessage,
}: {
  chart: DeptKpiChartType | null;
  emptyMessage: string;
}) {
  if (!chart || !chart.points.length) {
    return (
      <div className="card p-5 text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  if (chart.kind === "line") {
    return (
      <div className="card h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart.points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xKey} />
            <YAxis />
            <Tooltip />
            {chart.series.map((series) => (
              <Line key={series.key} type="monotone" dataKey={series.key} stroke="#2D7CC4" strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.kind === "area") {
    return (
      <div className="card h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chart.points}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chart.xKey} />
            <YAxis />
            <Tooltip />
            {chart.series.map((series, index) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                stroke={index === 0 ? "#10B981" : "#EF4444"}
                fill={index === 0 ? "#10B98133" : "#EF444433"}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="card h-[300px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={chart.xKey} />
          <YAxis />
          <Tooltip />
          {chart.series.map((series) => (
            <Bar key={series.key} dataKey={series.key} fill="#2D7CC4" />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

