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

type ChartPoint = Record<string, string | number>;

export function DeptKpiChart({
  deptKey,
  data,
}: {
  deptKey: string;
  data: ChartPoint[];
}) {
  if (!data.length) {
    return (
      <div className="card p-5 text-sm text-gray-500">
        Graphiques disponibles dès l&apos;activation du module.
      </div>
    );
  }

  if (deptKey === "vente") {
    return (
      <div className="card h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#2D7CC4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (deptKey === "finance") {
    return (
      <div className="card h-[300px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B98133" />
            <Area type="monotone" dataKey="expenses" stroke="#EF4444" fill="#EF444433" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="card h-[300px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#2D7CC4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

