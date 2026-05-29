import {
  generateForecast,
  linearRegression,
  type MonthlyDataPoint,
} from "@/lib/utils/forecast";

describe("linearRegression()", () => {
  it("should handle empty data array", () => {
    const result = linearRegression([]);
    expect(result).toBeDefined();
    expect(Number.isNaN(result.slope)).toBe(false);
    expect(Number.isNaN(result.intercept)).toBe(false);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
    expect(result.r_squared).toBe(0);
  });

  it("should handle single data point", () => {
    const result = linearRegression([{ x: 1, y: 500_000 }]);
    expect(result).toBeDefined();
    expect(Number.isNaN(result.slope)).toBe(false);
    expect(Number.isNaN(result.intercept)).toBe(false);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it("should calculate correct slope for linear data", () => {
    const data = [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 9 },
    ];
    const result = linearRegression(data);
    expect(result.slope).toBeCloseTo(2, 0);
    expect(result.intercept).toBeCloseTo(1, 0);
  });

  it("should return R² between 0 and 1", () => {
    const data = [
      { x: 1, y: 100_000 },
      { x: 2, y: 150_000 },
      { x: 3, y: 200_000 },
      { x: 4, y: 180_000 },
      { x: 5, y: 250_000 },
    ];
    const result = linearRegression(data);
    expect(result.r_squared).toBeGreaterThanOrEqual(0);
    expect(result.r_squared).toBeLessThanOrEqual(1);
  });

  it("should predict future values correctly", () => {
    const data = [
      { x: 1, y: 1_000_000 },
      { x: 2, y: 2_000_000 },
      { x: 3, y: 3_000_000 },
    ];
    const result = linearRegression(data);
    const prediction = result.slope * 4 + result.intercept;
    expect(prediction).toBeCloseTo(4_000_000, -3);
  });
});

describe("generateForecast()", () => {
  const history: MonthlyDataPoint[] = [
    { month: "2026-01", month_label: "Jan 2026", revenue_gnf: 1_000_000, is_forecast: false },
    { month: "2026-02", month_label: "Fév 2026", revenue_gnf: 1_200_000, is_forecast: false },
    { month: "2026-03", month_label: "Mar 2026", revenue_gnf: 1_100_000, is_forecast: false },
    { month: "2026-04", month_label: "Avr 2026", revenue_gnf: 1_400_000, is_forecast: false },
    { month: "2026-05", month_label: "Mai 2026", revenue_gnf: 1_300_000, is_forecast: false },
  ];

  it("should return 3 months of forecasts", () => {
    const forecasts = generateForecast(history, 3);
    expect(forecasts).toHaveLength(3);
    forecasts.forEach((f) => {
      expect(f.revenue_gnf).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(f.revenue_gnf)).toBe(false);
      expect(f.is_forecast).toBe(true);
    });
  });

  it("should handle empty history", () => {
    const forecasts = generateForecast([], 3);
    expect(Array.isArray(forecasts)).toBe(true);
    expect(forecasts).toHaveLength(0);
  });
});
