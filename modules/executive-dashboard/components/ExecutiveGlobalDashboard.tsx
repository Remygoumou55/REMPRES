"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { DEPARTMENT_LABELS } from "@/lib/constants/departments";
import { ROUTES } from "@/lib/constants/routes";
import { queryKeys } from "@/lib/query/query-keys";
import { useTranslation } from "@/hooks/use-translation";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ExecutiveWidgetShell } from "../widgets/executive-widget-shell";
import { ExecutiveDomainChart } from "../charts/executive-domain-chart";
import { EXECUTIVE_GLOBAL_KPI_DEPT_KEYS } from "../kpi/executive-kpi-scope";
import { useExecutiveGlobalSnapshot } from "../hooks/use-executive-global-snapshot";

const COMMAND_LINKS = [
  { href: "/admin/platform-dashboard", labelKey: "executive.global.link.platform" },
  { href: "/admin/approvals", labelKey: "executive.global.link.approvals" },
  { href: "/admin/alerts", labelKey: "executive.global.link.alerts" },
  { href: "/admin/audit", labelKey: "executive.global.link.audit" },
  { href: "/admin/activity-logs", labelKey: "executive.global.link.activity" },
  { href: "/admin/intelligence", labelKey: "executive.global.link.intelligence" },
  { href: "/dashboard/executive/intelligence", labelKey: "executive.global.link.biIntelligence" },
  { href: "/dashboard/executive/forecast", labelKey: "executive.global.link.forecast" },
  { href: "/admin/observability", labelKey: "executive.global.link.observabilityHub" },
] as const;

export function ExecutiveGlobalDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isRefetching, refetch, error } = useExecutiveGlobalSnapshot(
    EXECUTIVE_GLOBAL_KPI_DEPT_KEYS,
    queryKeys.executive.globalSnapshot,
    { staleTime: 45_000, refetchInterval: 120_000 },
  );

  const domainBlocks = useMemo(() => {
    if (!data) return [];
    return EXECUTIVE_GLOBAL_KPI_DEPT_KEYS.map((key) => ({
      key,
      label: DEPARTMENT_LABELS[key] ?? key,
      payload: data.domains[key],
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="page-wrapper mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-16 w-full rounded-card" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper mx-auto max-w-6xl">
        <PageHeader
          title={t("executive.global.title", "Executive command center")}
          subtitle={t("executive.global.subtitle", "Cross-domain KPI intelligence")}
        />
        <div className="card p-6 text-sm text-red-600">
          {t("executive.global.error.load", "Unable to load executive snapshot.")}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("executive.global.title", "Executive command center")}
        subtitle={t("executive.global.subtitle", "Cross-domain KPI intelligence — realtime-safe orchestration")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              {t("executive.global.refresh", "Refresh")}
            </Button>
            <Link
              href={ROUTES.home}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("executive.global.backOperational", "Operational dashboard")}
            </Link>
          </div>
        }
      />

      {data ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-gray-100 bg-white px-4 py-3 text-xs text-gray-600">
          <span>
            {t("executive.global.meta.loaded", "Domains loaded")}:{" "}
            <strong>{data.executiveMeta.domainsLoaded}</strong> · {t("executive.global.meta.failed", "Failed")}:{" "}
            <strong>{data.executiveMeta.domainsFailed}</strong>
          </span>
          <span className="font-mono text-[11px] text-gray-500">
            {t("executive.global.meta.correlation", "Correlation")}: {data.executiveMeta.correlationId}
          </span>
        </div>
      ) : null}

      <section className="card p-4">
        <h2 className="text-sm font-semibold text-darktext">{t("executive.global.command.title", "Operations command")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMMAND_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-darktext hover:bg-gray-100"
            >
              {t(item.labelKey, item.href)}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {domainBlocks.map(({ key, label, payload }) => {
          const chart = payload?.charts?.[0] ?? null;
          const stats = payload?.stats ?? [];
          const health = payload?.health?.status ?? "placeholder";
          return (
            <ExecutiveWidgetShell
              key={key}
              title={label}
              subtitle={`${t("executive.global.health", "Health")}: ${health}`}
              actions={<Activity className="h-4 w-4 text-gray-400" aria-hidden />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {stats.slice(0, 4).map((stat) => (
                  <StatsCard
                    key={stat.id}
                    title={t(stat.label, stat.id)}
                    value={Number(stat.value ?? 0)}
                    icon={Activity}
                    color="blue"
                  />
                ))}
              </div>
              <div className="mt-4">
                <ExecutiveDomainChart
                  chart={chart}
                  emptyMessage={t("executive.global.chart.empty", "Chart will appear when data is available.")}
                />
              </div>
            </ExecutiveWidgetShell>
          );
        })}
      </div>
    </div>
  );
}
