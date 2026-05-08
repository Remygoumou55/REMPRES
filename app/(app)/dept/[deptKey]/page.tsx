"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Activity, Box, ShoppingCart, Users, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import { ROUTES } from "@/lib/constants/routes";
import { useSectionDashboard } from "@/hooks/useSectionDashboard";
import { DeptDashboardShell } from "@/components/dept/dept-dashboard-shell";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query/query-keys";
import { useTranslation } from "@/hooks/use-translation";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";

const DynamicDeptKpiChart = dynamic(() => import("./DeptKpiChart").then((m) => m.DeptKpiChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-card" />,
});

export default function DeptDashboardPage() {
  const params = useParams<{ deptKey: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const deptKey = String(params.deptKey ?? "").toLowerCase() as DepartmentKey;
  const department = DEPARTMENTS.find((item) => item.key === deptKey);

  useEffect(() => {
    if (!department) router.replace(ROUTES.dept);
  }, [department, router]);

  const { data, isLoading, isRefetching, refetch } = useSectionDashboard<DeptKpiApiResponse>(
    `/api/dept/${deptKey}/kpis`,
    [...queryKeys.dept.kpis(deptKey)],
    { staleTime: 30_000, refetchInterval: 60_000, enabled: Boolean(department) },
  );

  const kpis = useMemo(() => {
    const stats = data?.data.stats ?? [];
    const iconByStat: Record<string, typeof Users> = {
      clients: Users,
      products: Box,
      salesToday: ShoppingCart,
      salesThisMonth: Wallet,
      revenue: Wallet,
      expenses: ShoppingCart,
      margin: Activity,
      transactions: Box,
    };
    const colorByStat: Record<string, "blue" | "green" | "orange" | "purple" | "red"> = {
      clients: "blue",
      products: "green",
      salesToday: "orange",
      salesThisMonth: "purple",
      revenue: "green",
      expenses: "red",
      margin: "blue",
      transactions: "orange",
    };
    return stats.slice(0, 4).map((stat) => ({
      title: t(stat.label, stat.id),
      value: Number(stat.value ?? 0),
      icon: iconByStat[stat.id] ?? Users,
      color: colorByStat[stat.id] ?? "blue",
    }));
  }, [data?.data.stats, t]);

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full rounded-card" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-card" />
      </div>
    );
  }

  if (!department) return null;

  const Icon = department.icon;
  const recentActivity = data?.data.activity ?? [];
  const chart = (data?.data.charts ?? [])[0] ?? null;

  return (
    <DeptDashboardShell
      title={department.label}
      subtitle={department.description}
      icon={<Icon size={16} />}
      color={department.color}
      backHref={ROUTES.dept}
      backLabel={t("dashboard.dept.backToDepartments", "← Départements")}
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      lastUpdated={data?.lastUpdated ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, locale: fr }) : null}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatsCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} color={kpi.color} />
        ))}
      </div>

      <DynamicDeptKpiChart chart={chart} emptyMessage={t("dashboard.dept.chart.empty", "Graphiques disponibles dès l'activation du module.")} />

      <section className="card p-5">
        <h2 className="section-title">{t("dashboard.dept.activity.title", "Activité récente")}</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">{t("dashboard.dept.activity.empty", "Aucune activité récente.")}</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-700">{t(entry.label, entry.label)}</span>
                <span className="text-xs text-gray-500">
                  {entry.timestamp ? formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true, locale: fr }) : "--"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/activity-logs" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
          {t("dashboard.dept.activity.viewAll", "Voir tout")} →
        </Link>
      </section>
    </DeptDashboardShell>
  );
}

