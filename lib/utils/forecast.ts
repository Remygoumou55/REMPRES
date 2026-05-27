export type MonthlyDataPoint = {
  month: string;
  month_label: string;
  revenue_gnf: number;
  is_forecast: boolean;
};

export type LinearRegressionResult = {
  slope: number;
  intercept: number;
  r_squared: number;
};

export function linearRegression(
  points: { x: number; y: number }[],
): LinearRegressionResult {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r_squared: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: Math.round(sumY / n), r_squared: 1 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
  const ssRes = points.reduce(
    (s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2),
    0,
  );
  const r_squared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return {
    slope: Math.round(slope),
    intercept: Math.round(intercept),
    r_squared: Math.round(r_squared * 1000) / 1000,
  };
}

const FR_MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

export function generateForecast(
  historicalData: MonthlyDataPoint[],
  forecastMonths = 3,
): MonthlyDataPoint[] {
  if (historicalData.length < 2) return [];

  const points = historicalData.map((d, i) => ({ x: i + 1, y: d.revenue_gnf }));
  const { slope, intercept } = linearRegression(points);

  const lastDate = new Date(
    historicalData[historicalData.length - 1]!.month + "-01",
  );

  const forecasts: MonthlyDataPoint[] = [];
  for (let i = 1; i <= forecastMonths; i++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    const x = historicalData.length + i;
    const predicted = Math.max(0, Math.round(slope * x + intercept));
    const monthStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;
    const label = `${FR_MONTHS_SHORT[futureDate.getMonth()]} ${futureDate.getFullYear()}`;
    forecasts.push({
      month: monthStr,
      month_label: label,
      revenue_gnf: predicted,
      is_forecast: true,
    });
  }
  return forecasts;
}

export function formatGnfCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M GNF";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K GNF";
  return n + " GNF";
}

export function getTrendLabel(slope: number): { label: string; color: string } {
  if (slope > 500_000) return { label: "↑ Forte croissance", color: "#27500A" };
  if (slope > 0) return { label: "↗ Croissance modérée", color: "#1D9E75" };
  if (slope === 0) return { label: "→ Stable", color: "#444441" };
  if (slope > -500_000) return { label: "↘ Légère baisse", color: "#633806" };
  return { label: "↓ Baisse significative", color: "#791F1F" };
}

export function getRSquaredLabel(r: number): string {
  if (r >= 0.9) return "Très fiable";
  if (r >= 0.7) return "Fiable";
  if (r >= 0.5) return "Indicatif";
  return "Faible fiabilité";
}
