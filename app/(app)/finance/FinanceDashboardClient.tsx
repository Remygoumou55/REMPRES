"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Download,
  FileText,
  LineChart,
  Radio,
  RefreshCw,
  Settings2,
  Wallet,
} from "lucide-react";
import type { CsvExportSections, FinanceCfoData, FinanceDayPoint } from "@/lib/server/finance-overview";
import { convertAmount, formatAmount, type Currency, type CurrencyRates } from "@/lib/currencyService";
import { displayGnf } from "@/lib/finance-display";
import { PageHeader } from "@/components/ui/page-header";
import type { ExpenseCategoryRow } from "@/lib/server/expenses";
import {
  buildFinanceProjection,
  DEFAULT_PROJECTION_HORIZON,
  toRevenueExpenseChartRows,
  type FinanceProjectionDay,
  type RevExpChartRow,
} from "@/lib/finance-forecast";
import {
  computeFinanceAlerts,
  DEFAULT_ALERT_SETTINGS,
  loadAlertSettings,
  saveAlertSettings,
  type FinanceAlertItem,
  type FinanceAlertSettings,
} from "@/lib/finance-alerts";
import { useFinanceLiveData } from "./hooks/useFinanceLiveData";
import { FinanceExportModal, type PdfSections } from "@/components/finance/FinanceExportModal";
import { SearchInput } from "@/components/ui/search-input";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";

const CURRENCY_KEY = "rempres-finance-currency";

type ChartMode = "7d" | "range";

type Props = {
  data: FinanceCfoData;
  from: string;
  to: string;
  categoryOptions: ExpenseCategoryRow[];
  profileOptions: { id: string; label: string }[];
  canFilterByUser: boolean;
  selectedCategoryIds: string[];
  selectedCreatedBy: string | null;
  currencyRates: CurrencyRates;
};

function useDisplayCurrency() {
  const [currency, setCurrency] = useState<Currency>("GNF");
  useEffect(() => {
    const s = localStorage.getItem(CURRENCY_KEY) as Currency | null;
    if (s && ["GNF", "XOF", "USD", "EUR"].includes(s)) setCurrency(s);
  }, []);
  const set = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem(CURRENCY_KEY, c);
  };
  return [currency, set] as const;
}

function DeltaText({
  pct,
  kind,
}: {
  pct: number | null;
  kind: "revenue" | "expenses" | "profit";
}) {
  if (pct == null) {
    return <span className="text-gray-400">n/a</span>;
  }
  const good =
    kind === "revenue" || kind === "profit"
      ? pct >= 0
      : kind === "expenses"
        ? pct <= 0
        : true;
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${good ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {pct >= 0 ? "+" : ""}
      {pct.toFixed(1)}% vs période préc.
    </span>
  );
}

function KpiCard({
  title,
  value,
  sub,
  accent,
  titleHint,
}: {
  title: string;
  value: string;
  sub?: React.ReactNode;
  accent: "neutral" | "green" | "red" | "blue" | "amber";
  titleHint?: string;
}) {
  const ring: Record<typeof accent, string> = {
    green: "border-emerald-100 bg-emerald-50/40",
    red: "border-rose-100 bg-rose-50/40",
    blue: "border-sky-100 bg-sky-50/40",
    amber: "border-amber-100 bg-amber-50/40",
    neutral: "border-gray-100 bg-white",
  };
  return (
    <div
      className={`rounded-2xl border px-5 py-4 shadow-sm transition-all duration-300 hover:shadow-md ${ring[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500" title={titleHint}>
        {title}
      </p>
      <p className="mt-2 text-xl font-bold tabular-nums text-darktext">{value}</p>
      {sub && <div className="mt-2 text-sm">{sub}</div>}
    </div>
  );
}

function CategoryBar({
  rows,
  fmt,
}: {
  rows: { categoryId: string; name: string; color: string; amount: number }[];
  fmt: (gnf: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center text-sm text-gray-400">
        Aucune dépense sur la période.
      </p>
    );
  }
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pct = Math.max((r.amount / max) * 100, 4);
        return (
          <li key={r.categoryId} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-darktext">{r.name}</span>
              <span className="tabular-nums text-gray-600">{fmt(r.amount)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: r.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ChartBlockRevenueExpense({
  mode,
  onModeChange,
  baseRange,
  base7d,
  forecastNextDays,
  currency,
  rates,
}: {
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  baseRange: FinanceDayPoint[];
  base7d: FinanceDayPoint[];
  forecastNextDays: FinanceProjectionDay[];
  currency: Currency;
  rates: CurrencyRates;
}) {
  const series = mode === "7d" ? base7d : baseRange;
  const withForecast: RevExpChartRow[] = useMemo(() => {
    if (mode === "7d") {
      return toRevenueExpenseChartRows(series, []);
    }
    return toRevenueExpenseChartRows(baseRange, forecastNextDays);
  }, [mode, series, baseRange, forecastNextDays]);

  const chartData = useMemo(() => {
    const conv = (g: number) => convertAmount(g, currency, rates);
    return withForecast.map((d) => ({
      ...d,
      labelShort: d.label,
      revenue: conv(d.revenue),
      expenses: conv(d.expenses),
      revProj: d.revProj == null ? null : conv(d.revProj),
      expProj: d.expProj == null ? null : conv(d.expProj),
    }));
  }, [withForecast, currency, rates]);

  const fmtY = (v: number) => formatAmount(v, currency);
  const empty =
    chartData.length === 0 || chartData.every((d) => d.revenue === 0 && d.expenses === 0 && !d.revProj);

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
      {empty ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
          <p className="text-sm font-medium text-gray-400">Aucune donnée sur la plage affichée</p>
        </div>
      ) : (
        <div className="h-80 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
              <XAxis
                dataKey="labelShort"
                tick={{ fontSize: 10, fill: "#64748b" }}
                interval={0}
                angle={chartData.length > 12 ? -35 : 0}
                textAnchor={chartData.length > 12 ? "end" : "middle"}
                height={chartData.length > 12 ? 70 : 28}
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
}

function CashflowChart({
  points,
  currency,
  rates,
}: {
  points: FinanceCfoData["cashflowInRange"];
  currency: Currency;
  rates: CurrencyRates;
}) {
  const fmt = (v: number) => formatAmount(v, currency);
  const chartData = useMemo(
    () =>
      points.map((p) => {
        const conv = (g: number) => convertAmount(g, currency, rates);
        return {
          ...p,
          labelShort: p.label,
          cashIn: conv(p.cashIn),
          cashOut: conv(p.cashOut),
          net: conv(p.net),
          cumulative: conv(p.cumulative),
        };
      }),
    [points, currency, rates],
  );
  const empty = chartData.length === 0 || chartData.every((d) => d.cashIn === 0 && d.cashOut === 0);
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
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
          <XAxis
            dataKey="labelShort"
            tick={{ fontSize: 10, fill: "#64748b" }}
            interval={0}
            angle={chartData.length > 10 ? -35 : 0}
            textAnchor={chartData.length > 10 ? "end" : "middle"}
            height={chartData.length > 10 ? 64 : 28}
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
}

function AlertsSection({
  alerts,
  settings,
  onChangeSettings,
}: {
  alerts: FinanceAlertItem[];
  settings: FinanceAlertSettings;
  onChangeSettings: (s: FinanceAlertSettings) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      {alerts.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 transition-all">
          <p className="text-xs font-bold uppercase text-amber-800">Alertes</p>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  a.level === "critical" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-white text-amber-900"
                }`}
              >
                <span className="font-semibold">{a.title}.</span> {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Seuils d’alerte (local)
        </button>
        {open && (
          <div className="flex w-full max-w-lg flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm">
            <label className="flex flex-col gap-1">
              Seuil dépense max / jour (GNF, 0 = off)
              <input
                type="number"
                className="rounded border border-gray-200 px-2 py-1"
                value={settings.maxDayExpenseGnf || ""}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    maxDayExpenseGnf: Number(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              Alerte si variation CA &lt; (% vs période préc.)
              <input
                type="number"
                className="rounded border border-gray-200 px-2 py-1"
                value={settings.minRevenueDeltaPct}
                onChange={(e) =>
                  onChangeSettings({ ...settings, minRevenueDeltaPct: Number(e.target.value) || -8 })
                }
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.warnNegativeProfit}
                onChange={(e) => onChangeSettings({ ...settings, warnNegativeProfit: e.target.checked })}
              />
              Alerter si résultat négatif
            </label>
            <button
              type="button"
              onClick={() => {
                onChangeSettings({ ...DEFAULT_ALERT_SETTINGS });
                saveAlertSettings({ ...DEFAULT_ALERT_SETTINGS });
              }}
              className="text-xs text-primary"
            >
              Réinitialiser les seuils
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function FinanceDashboardClient({
  data: initial,
  from,
  to,
  categoryOptions,
  profileOptions,
  canFilterByUser,
  selectedCategoryIds,
  selectedCreatedBy,
  currencyRates,
}: Props) {
  const { data, updatedAt, refreshing, refetch } = useFinanceLiveData({
    initialData: initial,
    from,
    to,
    categoryIds: selectedCategoryIds,
    createdBy: selectedCreatedBy,
  });

  const [chartMode, setChartMode] = useState<ChartMode>("range");
  const [currency, setCurrency] = useDisplayCurrency();
  const [exportOpen, setExportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [alertSettings, setAlertSettingsState] = useState<FinanceAlertSettings>(DEFAULT_ALERT_SETTINGS);

  useEffect(() => {
    setAlertSettingsState(loadAlertSettings());
  }, []);

  const setAlertSettings = useCallback((s: FinanceAlertSettings) => {
    setAlertSettingsState(s);
    saveAlertSettings(s);
  }, []);

  const rates = currencyRates;
  const fmt = useCallback((gnf: number) => displayGnf(gnf, currency, rates), [currency, rates]);

  const profitPositive = data.profit >= 0;
  const projection = useMemo(
    () => buildFinanceProjection(data.chartInRange, to, DEFAULT_PROJECTION_HORIZON),
    [data.chartInRange, to],
  );

  const alerts = useMemo(
    () => computeFinanceAlerts(data, alertSettings),
    [data, alertSettings],
  );

  const exportQuery = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    for (const c of selectedCategoryIds) p.append("category", c);
    if (selectedCreatedBy) p.set("createdBy", selectedCreatedBy);
    return p.toString();
  }, [from, to, selectedCategoryIds, selectedCreatedBy]);

  const categorySearchRows = useMemo(
    () =>
      data.expensesByCategory.map((r) => ({
        ...r,
        searchBlob: `${r.name} ${Math.round(r.amount)}`,
      })),
    [data.expensesByCategory],
  );
  const {
    query: categorySearch,
    setQuery: setCategorySearch,
    filteredData: filteredCategoryRows,
  } = useGlobalSearch({
    data: categorySearchRows,
    searchFields: ["name", "searchBlob"],
    delay: 180,
    minQueryLength: 1,
  });

  const handleExport = async (format: "csv" | "pdf", csv: CsvExportSections, pdf: PdfSections) => {
    setExportBusy(true);
    try {
      const res = await fetch("/api/finance/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          categoryIds: selectedCategoryIds,
          createdBy: selectedCreatedBy,
          format,
          csvSections: csv,
          pdfSections: pdf,
        }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-${from}-${to}.${format === "pdf" ? "pdf" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800"
          title="Actualisation auto (~22 s) + abonnement aux changements sur financial_transactions"
        >
          <Radio className="h-3 w-3 animate-pulse text-emerald-600" />
          Live
        </span>
        <span>MAJ {updatedAt.toLocaleTimeString("fr-FR")}</span>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-darktext transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1">
          <span className="text-gray-500">Devise</span>
          <select
            className="bg-transparent text-sm font-medium"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            title="Affichage uniquement — compta en GNF en base"
          >
            {(["GNF", "XOF", "USD", "EUR"] as const).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PageHeader
        title="Finance"
        subtitle="Pilotage — données en GNF, affichage multi-devise. Prévision = modèle indicatif (tendance linéaire sur la période)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary"
            >
              <Download className="h-4 w-4" />
              Export avancé
            </button>
            <a
              href={`/api/finance/export?format=csv&${exportQuery}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Excel (rapide)
            </a>
            <a
              href={`/api/finance/export?format=pdf&${exportQuery}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
            >
              <FileText className="h-4 w-4" />
              PDF
            </a>
            <Link
              href={`/finance/depenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
            >
              <Wallet className="h-4 w-4" />
              Dépenses
            </Link>
          </div>
        }
      />

      <AlertsSection alerts={alerts} settings={alertSettings} onChangeSettings={setAlertSettings} />

      <form
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        action="/finance"
        method="get"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Calendar className="h-4 w-4 text-primary" />
            Période
          </div>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Du
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-darktext"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Au
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-darktext"
            />
          </label>
        </div>
        <div>
          <p
            className="mb-2 text-xs font-medium text-gray-600"
            title="N’affecte que les montants de dépenses. Le chiffre d’affaires reste complet."
          >
            Catégories (dépenses)
          </p>
          <div className="flex flex-wrap gap-3">
            {categoryOptions.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={c.id}
                  defaultChecked={selectedCategoryIds.includes(c.id)}
                />
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        {canFilterByUser && profileOptions.length > 0 && (
          <div className="flex max-w-md flex-col gap-1 text-xs text-gray-500">
            Auteur (transaction) — super admin
            <select
              name="createdBy"
              defaultValue={selectedCreatedBy ?? ""}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-darktext"
            >
              <option value="">Tous les utilisateurs</option>
              {profileOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Appliquer les filtres
          </button>
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Réinitialiser
          </Link>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Chiffre d'affaires"
          value={fmt(data.totalRevenue)}
          sub={<DeltaText pct={data.delta.revenuePct} kind="revenue" />}
          accent="blue"
        />
        <KpiCard
          title="Dépenses"
          value={fmt(data.totalExpenses)}
          sub={<DeltaText pct={data.delta.expensesPct} kind="expenses" />}
          accent="neutral"
        />
        <KpiCard
          title="Résultat (CA − dépenses)"
          value={fmt(data.profit)}
          sub={<DeltaText pct={data.delta.profitPct} kind="profit" />}
          accent={profitPositive ? "green" : "red"}
        />
        <KpiCard
          title="Marge nette"
          value={data.marginPct == null ? "—" : `${data.marginPct.toFixed(1)} %`}
          sub={<span className="text-gray-500">(identique toute devise)</span>}
          accent="amber"
          titleHint="(Chiffre d'affaires − dépenses) / chiffre d'affaires"
        />
        <KpiCard
          title="Moy. revenu / jour"
          value={fmt(data.avgDailyRevenue)}
          sub={
            <span className="text-gray-500">
              sur {data.dayCount} jour{data.dayCount > 1 ? "s" : ""}
            </span>
          }
          accent="blue"
        />
        <KpiCard title="Moy. dépense / jour" value={fmt(data.avgDailyExpenses)} accent="neutral" />
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-darktext">
          <LineChart className="h-5 w-5 text-indigo-600" />
          Prévision (indicatif)
        </h2>
        <p className="mb-3 text-xs text-gray-600">
          Sur les {DEFAULT_PROJECTION_HORIZON} jours calendaires suivant <strong>{to}</strong> : CA projeté {fmt(projection.totalProjectedRevenue)}, dépenses {fmt(projection.totalProjectedExpenses)}, résultat {fmt(projection.totalProjectedProfit)}. Basé sur la tendance de la période filtrée, sans saisonnalité.
        </p>
        <ul className="grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
          <li className="rounded-lg border border-white/60 bg-white/80 px-3 py-2">
            Tendance revenus (GNF/j) ≈ {Math.round(projection.trendRevenuePerDay).toLocaleString("fr-FR")}
          </li>
          <li className="rounded-lg border border-white/60 bg-white/80 px-3 py-2">
            Tendance dépenses (GNF/j) ≈ {Math.round(projection.trendExpensesPerDay).toLocaleString("fr-FR")}
          </li>
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <ChartBlockRevenueExpense
          mode={chartMode}
          onModeChange={setChartMode}
          baseRange={data.chartInRange}
          base7d={data.chartLast7d}
          forecastNextDays={chartMode === "range" ? projection.nextDays : []}
          currency={currency}
          rates={rates}
        />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-darktext">Trésorerie (flux & cumul net)</h2>
          </div>
          <p className="mb-3 text-xs text-gray-500">Affichage converti selon la devise choisie (données source en GNF).</p>
          <CashflowChart points={data.cashflowInRange} currency={currency} rates={rates} />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-darktext">Dépenses par catégorie</h2>
          <SearchInput
            value={categorySearch}
            onChange={setCategorySearch}
            placeholder="Filtrer catégories (nom ou montant)..."
            className="mb-3 w-full sm:max-w-sm"
          />
          <CategoryBar rows={filteredCategoryRows} fmt={fmt} />
        </div>
      </div>

      <FinanceExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={handleExport}
        busy={exportBusy}
      />
    </div>
  );
}
