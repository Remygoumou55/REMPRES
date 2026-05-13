"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Landmark,
  Radio,
  RefreshCw,
  Wallet,
} from "lucide-react";
import type { CsvExportSections, FinanceCfoData } from "@/lib/server/finance-overview";
import { formatAmount, type Currency } from "@/lib/currencyService";
import { PageHeader } from "@/components/ui/page-header";
import type { ExpenseCategoryRow } from "@/lib/server/expenses";
import {
  buildFinanceProjection,
  DEFAULT_PROJECTION_HORIZON,
} from "@/lib/finance-forecast";
import {
  computeFinanceAlerts,
  DEFAULT_ALERT_SETTINGS,
  loadAlertSettings,
  saveAlertSettings,
  type FinanceAlertSettings,
} from "@/lib/finance-alerts";
import { useFinanceLiveData } from "./hooks/useFinanceLiveData";
import type { PdfSections } from "@/components/finance/FinanceExportModal";
import { SearchInput } from "@/components/ui/search-input";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { GLOBAL_LIST_SEARCH_DEBOUNCE_MS } from "@/lib/data-listing";
import { useCurrencyBatchConversion } from "@/hooks/useCurrencyConversion";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useToast } from "@/components/providers/ToastProvider";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

// Sub-components
import { DeltaText, FinanceKpiCard } from "./components/FinanceKpis";
import type { ChartMode } from "./components/FinanceCharts";
import { AlertsSection } from "./components/FinanceAlerts";
import { CategoryBar } from "./components/FinanceCategoryBreakdown";

const FinanceExportModal = dynamic(
  () => import("@/components/finance/FinanceExportModal").then((m) => m.FinanceExportModal),
  { ssr: false },
);

const ChartBlockRevenueExpense = dynamic(
  () => import("./components/FinanceCharts").then((m) => m.ChartBlockRevenueExpense),
  { ssr: false },
);

const CashflowChart = dynamic(
  () => import("./components/FinanceCharts").then((m) => m.CashflowChart),
  { ssr: false },
);

// ---------------------------------------------------------------------------
// Constants & Types
// ---------------------------------------------------------------------------

const CURRENCY_OPTIONS = ["GNF", "XOF", "USD", "EUR"] as const;

type Props = {
  data: FinanceCfoData;
  from: string;
  to: string;
  categoryOptions: ExpenseCategoryRow[];
  profileOptions: { id: string; label: string }[];
  canFilterByUser: boolean;
  selectedCategoryIds: string[];
  selectedCreatedBy: string | null;
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FinanceDashboardClient({
  data: initial,
  from,
  to,
  categoryOptions,
  profileOptions,
  canFilterByUser,
  selectedCategoryIds,
  selectedCreatedBy,
}: Props) {
  const { showSuccess, showError } = useToast();
  const { data, updatedAt, refreshing, refetch } = useFinanceLiveData({
    initialData: initial,
    from,
    to,
    categoryIds: selectedCategoryIds,
    createdBy: selectedCreatedBy,
  });

  // ── State ───────────────────────────────────────────────────────────────
  const [chartMode, setChartMode]               = useState<ChartMode>("range");
  const [exportOpen, setExportOpen]             = useState(false);
  const [exportBusy, setExportBusy]             = useState(false);
  const [alertSettings, setAlertSettingsState] = useState<FinanceAlertSettings>(DEFAULT_ALERT_SETTINGS);

  const currency    = useCurrencyStore((state) => state.selectedCurrency);
  const setCurrency = useCurrencyStore((state) => state.setSelectedCurrency);

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setAlertSettingsState(loadAlertSettings());
  }, []);

  const setAlertSettings = useCallback((s: FinanceAlertSettings) => {
    setAlertSettingsState(s);
    saveAlertSettings(s);
  }, []);

  // ── Derived State (Memoized) ────────────────────────────────────────────
  const projection = useMemo(
    () => buildFinanceProjection(data.chartInRange, to, DEFAULT_PROJECTION_HORIZON),
    [data.chartInRange, to],
  );

  const financeConvItems = useMemo(
    () => [
      { key: "kpi:totalRevenue", amount: data.totalRevenue },
      { key: "kpi:totalExpenses", amount: data.totalExpenses },
      { key: "kpi:profit", amount: data.profit },
      { key: "kpi:avgDailyRevenue", amount: data.avgDailyRevenue },
      { key: "kpi:avgDailyExpenses", amount: data.avgDailyExpenses },
      { key: "proj:totalProjectedRevenue", amount: projection.totalProjectedRevenue },
      { key: "proj:totalProjectedExpenses", amount: projection.totalProjectedExpenses },
      { key: "proj:totalProjectedProfit", amount: projection.totalProjectedProfit },
      ...data.expensesByCategory.map((r) => ({
        key: `cat:${r.categoryId}`,
        amount: r.amount,
      })),
    ],
    [data, projection],
  );

  const {
    convertedByKey: financeConverted,
    loading: financeConvLoading,
  } = useCurrencyBatchConversion(financeConvItems, "GNF", currency);

  const fmt = useCallback(
    (key: string, amountGnf: number) => {
      if (!Number.isFinite(amountGnf)) return "—";
      if (financeConvLoading) return "…";
      const v = financeConverted[key];
      if (v === undefined) return "…";
      if (v === null) return "Conversion indisponible";
      return formatAmount(v, currency);
    },
    [currency, financeConverted, financeConvLoading],
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
    delay: GLOBAL_LIST_SEARCH_DEBOUNCE_MS,
    minQueryLength: 1,
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleExport = async (format: "csv" | "pdf", csv: CsvExportSections, pdf: PdfSections) => {
    setExportBusy(true);
    try {
      const res = await fetch("/api/finance/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to, categoryIds: selectedCategoryIds, createdBy: selectedCreatedBy,
          format, csvSections: csv, pdfSections: pdf,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        showError(detail.trim() || "L'export n'a pas pu être généré. Réessayez dans un instant.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-${from}-${to}.${format === "pdf" ? "pdf" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      showSuccess(format === "pdf" ? "PDF téléchargé." : "Fichier téléchargé.");
    } catch {
      showError("Réseau indisponible ou export interrompu.");
    } finally {
      setExportBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
          <Radio className="h-3 w-3 animate-pulse text-emerald-600" /> Temps réel
        </span>
        <span>MAJ {updatedAt.toLocaleTimeString("fr-FR")}</span>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 font-medium text-darktext transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
        </button>
        <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1">
          <span className="text-gray-500">Devise</span>
          <select
            className="bg-transparent text-sm font-medium outline-none"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <PageHeader
        title="Finance"
        subtitle="Pilotage financier — données en GNF, affichage multi-devise."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition"
            >
              <Download className="h-4 w-4" /> Export avancé
            </button>
            <a
              href={`/api/finance/export?format=csv&${exportQuery}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm hover:bg-gray-50 transition"
            >
              <Download className="h-4 w-4" /> Excel
            </a>
            <Link
              href={`/finance/depenses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm hover:bg-gray-50 transition"
            >
              <Wallet className="h-4 w-4" /> Dépenses
            </Link>
            <Link
              href="/finance/enterprise"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary/10 transition"
            >
              <Landmark className="h-4 w-4" /> Espace Enterprise
            </Link>
          </div>
        }
      />

      <AlertsSection alerts={alerts} settings={alertSettings} onChangeSettings={setAlertSettings} />

      {/* Filters */}
      <FilterPanelShell title="Période & filtres">
      <form
        className="space-y-4"
        action="/finance"
        method="get"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Du
            </label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-darktext outline-none focus:border-primary focus:bg-white transition"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500">Au</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-darktext outline-none focus:border-primary focus:bg-white transition"
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500">Catégories</label>
            <select
              name="category"
              multiple
              className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs outline-none focus:border-primary focus:bg-white transition"
              defaultValue={selectedCategoryIds}
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {canFilterByUser && (
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-xs font-semibold text-gray-500">Auteur</label>
              <select
                name="createdBy"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white transition"
                defaultValue={selectedCreatedBy ?? ""}
              >
                <option value="">Tous</option>
                {profileOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition"
          >
            Filtrer
          </button>
        </div>
        <p className="text-[10px] text-gray-400">Maintenez Ctrl pour sélectionner plusieurs catégories.</p>
      </form>
      </FilterPanelShell>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FinanceKpiCard
          title="Revenus"
          value={fmt("kpi:totalRevenue", data.totalRevenue)}
          accent="green"
          sub={<DeltaText pct={data.delta.revenuePct} kind="revenue" />}
        />
        <FinanceKpiCard
          title="Dépenses"
          value={fmt("kpi:totalExpenses", data.totalExpenses)}
          accent="red"
          sub={<DeltaText pct={data.delta.expensesPct} kind="expenses" />}
        />
        <FinanceKpiCard
          title="Résultat Net"
          value={fmt("kpi:profit", data.profit)}
          accent={data.profit >= 0 ? "blue" : "red"}
          sub={<DeltaText pct={data.delta.profitPct} kind="profit" />}
        />
        <FinanceKpiCard
          title="Projection fin de mois"
          value={fmt("proj:totalProjectedProfit", projection.totalProjectedProfit)}
          accent="amber"
          sub={<span className="text-xs text-gray-400">Basé sur la tendance actuelle</span>}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartBlockRevenueExpense
            mode={chartMode}
            onModeChange={setChartMode}
            baseRange={data.chartInRange}
            base7d={data.chartLast7d}
            forecastNextDays={projection.nextDays}
            currency={currency}
          />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-darktext">Répartition par catégorie</h2>
            <SearchInput
              value={categorySearch}
              onChange={setCategorySearch}
              placeholder="Chercher…"
              className="h-8 w-32 text-xs"
            />
          </div>
          <CategoryBar rows={filteredCategoryRows} fmt={fmt} />
        </div>
      </div>

      {/* Cashflow Row */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-darktext">Flux de trésorerie (Cashflow)</h2>
        <CashflowChart points={data.cashflowInRange} currency={currency} />
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
