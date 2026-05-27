export type CampaignMetrics = {
  sent_count: number;
  open_count: number;
  click_count: number;
  conversion_count: number;
};

export type CampaignRates = {
  open_rate: number;
  click_rate: number;
  click_to_sent_rate: number;
  conversion_rate: number;
};

export type FunnelStep = {
  label: string;
  value: number;
  rate: number;
  color: string;
};

function safeRate(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;
}

export function computeRates(m: CampaignMetrics): CampaignRates {
  return {
    open_rate: safeRate(m.open_count, m.sent_count),
    click_rate: safeRate(m.click_count, m.open_count),
    click_to_sent_rate: safeRate(m.click_count, m.sent_count),
    conversion_rate: safeRate(m.conversion_count, m.sent_count),
  };
}

export function buildFunnel(m: CampaignMetrics): FunnelStep[] {
  const steps = [
    { label: "Envoyés", value: m.sent_count, color: "#185FA5" },
    { label: "Ouverts", value: m.open_count, color: "#2D7CC4" },
    { label: "Cliqués", value: m.click_count, color: "#3FA9D6" },
    { label: "Convertis", value: m.conversion_count, color: "#1D9E75" },
  ];

  const base = steps[0]?.value ?? 0;

  return steps.map((step, i) => ({
    ...step,
    rate:
      i === 0
        ? 100
        : base > 0
          ? Math.round((step.value / base) * 1000) / 10
          : 0,
  }));
}

export function formatRate(rate: number): string {
  return `${rate.toFixed(1)} %`;
}

export function getRateColor(rate: number): string {
  if (rate >= 20) return "#27500A";
  if (rate >= 10) return "#633806";
  return "#791F1F";
}

export function getRateBg(rate: number): string {
  if (rate >= 20) return "#EAF3DE";
  if (rate >= 10) return "#FAEEDA";
  return "#FCEBEB";
}

export function metricsFromCampaign(c: {
  sent_count?: number | null;
  open_count?: number | null;
  click_count?: number | null;
  conversion_count?: number | null;
}): CampaignMetrics {
  return {
    sent_count: Number(c.sent_count ?? 0),
    open_count: Number(c.open_count ?? 0),
    click_count: Number(c.click_count ?? 0),
    conversion_count: Number(c.conversion_count ?? 0),
  };
}
