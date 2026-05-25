"use client";

import { memo, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  CreditCard,
  GraduationCap,
  Megaphone,
  Package,
  Receipt,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardBanner } from "@/components/dashboard/dashboard-banner";
import { KpiCard, type KpiCardColor } from "@/components/dashboard/kpi-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DeptQuickActionsSection } from "@/components/dashboard/dept-quick-actions-section";
import { SectionLabel } from "@/components/dashboard/section-label";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import type { DeptKpiData } from "@/lib/server/dept-dashboard";
import { getGreeting } from "@/lib/utils/safe-query";

const DeptHomeCharts = dynamic(
  () => import("@/components/dashboard/dept-home-charts").then((m) => ({ default: m.DeptHomeCharts })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[220px] w-full rounded-2xl" />,
  },
);

const ICON_BY_NAME: Record<string, LucideIcon> = {
  TrendingUp,
  Users,
  Package,
  AlertTriangle,
  Receipt,
  Activity,
  CreditCard,
  Calendar,
  Clock,
  UserPlus,
  GraduationCap,
  Award,
  Briefcase,
  CheckCircle,
  FileText,
  ClipboardList,
  Building2,
  Megaphone,
  Target,
  BarChart3,
  ArrowLeftRight,
};

function alertLevelStyles(level: "HIGH" | "MEDIUM" | "LOW"): { bar: string; badge: string } {
  if (level === "HIGH") return { bar: "border-l-red-600", badge: "bg-red-100 text-red-800" };
  if (level === "MEDIUM") return { bar: "border-l-amber-400", badge: "bg-amber-50 text-amber-900" };
  return { bar: "border-l-slate-300", badge: "bg-slate-100 text-slate-700" };
}

export type DeptHomePageProps = {
  data: DeptKpiData;
  firstName: string;
};

export const DeptHomePage = memo(function DeptHomePage({ data, firstName }: DeptHomePageProps) {
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const frenchDate = useMemo(
    () =>
      new Date(nowTick).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [nowTick],
  );
  const clock = useMemo(
    () => new Date(nowTick).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    [nowTick],
  );

  const chartEmpty = data.chart7Days.length === 0;
  const platformOk = data.alerts.length === 0;
  const kpiSectionLabel = `KPI ${data.deptLabel.toUpperCase()}`;
  const chartsSectionLabel = `GRAPHIQUES ${data.deptLabel.toUpperCase()}`;

  return (
    <div className="page-wrapper space-y-6 pb-10">
      <DashboardBanner
        greeting={greeting}
        firstName={firstName}
        date={frenchDate}
        time={clock}
        subtitle={data.deptLabel}
        platformOk={platformOk}
        priorityCount={data.alerts.length}
      />

      <section aria-labelledby="dept-kpi-heading" className="space-y-3">
        <SectionLabel label={kpiSectionLabel} />
        <div id="dept-kpi-heading" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.kpis.map((kpi) => {
            const Icon = ICON_BY_NAME[kpi.icon] ?? Activity;
            return (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                subtitle={kpi.subtitle}
                icon={Icon}
                color={kpi.color as KpiCardColor}
                trend={kpi.trend}
                isEmpty={kpi.isEmpty}
              />
            );
          })}
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="dept-charts-heading">
        <SectionLabel label={chartsSectionLabel} />
        <div id="dept-charts-heading" className="grid gap-4 lg:grid-cols-2">
          <div className="card space-y-2 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-darktext">Évolution (7 j.)</p>
              <BarChart3 size={16} className="shrink-0 text-primary" />
            </div>
            <p className="text-xs text-gray-500">Montant agrégé sur 7 jours.</p>
            {chartEmpty ? (
              <EmptyChart />
            ) : (
              <DeptHomeCharts chart7Days={data.chart7Days} deptColor={data.deptColor} barOnly />
            )}
          </div>
          <div className="card space-y-2 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-darktext">Tendance (7 j.)</p>
              <TrendingUp size={16} className="shrink-0 text-primary" />
            </div>
            <p className="text-xs text-gray-500">Courbe consolidée — même périmètre.</p>
            {chartEmpty ? (
              <EmptyChart message="Pas encore de données" />
            ) : (
              <DeptHomeCharts chart7Days={data.chart7Days} deptColor={data.deptColor} lineOnly />
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card flex flex-col p-4 sm:p-5" aria-labelledby="dept-alerts-heading">
          <div className="mb-3">
            <h2 id="dept-alerts-heading" className="text-sm font-semibold text-darktext">
              Alertes rapides
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Aperçu — files complètes dans Actions / Alertes
            </p>
          </div>
          {data.alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
              <p className="text-sm font-medium text-gray-700">Aucune alerte active</p>
              <p className="text-xs text-gray-500">Tout est stable.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.alerts.map((alert) => {
                const st = alertLevelStyles(alert.level);
                return (
                  <li
                    key={alert.id}
                    className={`rounded-xl border border-gray-100 border-l-4 ${st.bar} bg-gray-50/60 px-3 py-2.5`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${st.badge}`}>
                        {alert.level}
                      </span>
                      <span className="text-[11px] text-gray-400">{alert.time}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-darktext">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card flex flex-col p-4 sm:p-5">
          <ActivityFeed
            items={data.recentActivity}
            title="Activité récente"
            viewAllHref="/actions/journaux"
          />
        </section>
      </div>

      <DeptQuickActionsSection dept={data.dept} deptLabel={data.deptLabel} />
    </div>
  );
});
