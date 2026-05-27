"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { CampaignFunnelChart } from "@/components/marketing/CampaignFunnelChart";
import { CampaignMetricsForm } from "@/components/marketing/CampaignMetricsForm";
import {
  buildFunnel,
  computeRates,
  formatRate,
  getRateBg,
  getRateColor,
  metricsFromCampaign,
  type CampaignMetrics,
} from "@/lib/utils/campaign-analytics";

type Props = {
  campaignId: string;
  metrics: CampaignMetrics;
};

function CampaignAnalyticsSectionInner({ campaignId, metrics }: Props) {
  const router = useRouter();
  const rates = computeRates(metrics);
  const funnel = buildFunnel(metrics);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Envoyés" value={metrics.sent_count.toLocaleString("fr-FR")} />
        <RateMetricCard label="Taux d'ouverture" rate={rates.open_rate} />
        <RateMetricCard label="Taux de clic" rate={rates.click_rate} />
        <RateMetricCard label="Taux de conversion" rate={rates.conversion_rate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="card p-6 lg:col-span-7">
          <h2 className="mb-4 text-base font-semibold text-darktext">
            Entonnoir de conversion
          </h2>
          <CampaignFunnelChart steps={funnel} />
        </div>
        <div className="card p-6 lg:col-span-5">
          <CampaignMetricsForm
            campaignId={campaignId}
            currentMetrics={metrics}
            onSuccess={() => router.refresh()}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-darktext">{value}</div>
    </div>
  );
}

function RateMetricCard({ label, rate }: { label: string; rate: number }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: getRateBg(rate),
        borderColor: getRateBg(rate),
      }}
    >
      <div className="text-xs font-medium opacity-80" style={{ color: getRateColor(rate) }}>
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold tabular-nums"
        style={{ color: getRateColor(rate) }}
      >
        {formatRate(rate)}
      </div>
    </div>
  );
}

export const CampaignAnalyticsSection = memo(CampaignAnalyticsSectionInner);

export { metricsFromCampaign };
