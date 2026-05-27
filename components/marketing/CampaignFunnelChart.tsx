"use client";

import { memo } from "react";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelStep } from "@/lib/utils/campaign-analytics";

type Props = {
  steps: FunnelStep[];
  title?: string;
};

type TooltipPayload = {
  payload?: FunnelStep;
};

function FunnelTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.[0]?.payload) return null;
  const step = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-darktext">{step.label}</p>
      <p className="text-gray-600">Nombre : {step.value.toLocaleString("fr-FR")}</p>
      <p className="text-gray-600">Taux vs envoyés : {step.rate.toFixed(1)} %</p>
    </div>
  );
}

function CampaignFunnelChartInner({ steps, title }: Props) {
  const allZero = steps.every((s) => s.value === 0);
  const chartData = steps.map((s) => ({
    name: s.label,
    value: s.value,
    rate: s.rate,
    color: s.color,
  }));

  if (allZero) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-2 text-center text-gray-500">
        <BarChart3 className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium">Aucune donnée disponible</p>
        <p className="text-xs">
          Renseignez les métriques pour voir l&apos;entonnoir
        </p>
      </div>
    );
  }

  return (
    <div>
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-darktext">{title}</h3>
      ) : null}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={72}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<FunnelTooltip />} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={36}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              style={{ fontSize: 10, fill: "#444441" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CampaignFunnelChart = memo(CampaignFunnelChartInner);
