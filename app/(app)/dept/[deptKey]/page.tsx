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

const DynamicDeptKpiChart = dynamic(() => import("./DeptKpiChart").then((m) => m.DeptKpiChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-card" />,
});

type DeptApiResponse = {
  dept: string;
  data: Record<string, unknown>;
  lastUpdated: string;
};

export default function DeptDashboardPage() {
  const params = useParams<{ deptKey: string }>();
  const router = useRouter();
  const deptKey = String(params.deptKey ?? "").toLowerCase() as DepartmentKey;
  const department = DEPARTMENTS.find((item) => item.key === deptKey);

  useEffect(() => {
    if (!department) router.replace(ROUTES.dept);
  }, [department, router]);

  const { data, isLoading, isRefetching, refetch } = useSectionDashboard<DeptApiResponse>(
    `/api/dept/${deptKey}/kpis`,
    ["dept-kpis", deptKey],
    { staleTime: 30_000, refetchInterval: 60_000, enabled: Boolean(department) },
  );

  const chartData = useMemo(() => {
    if (!data?.data) return [];
    if (deptKey === "vente") return ((data.data.salesLast7Days as Array<Record<string, string | number>> | undefined) ?? []);
    if (deptKey === "finance") return ((data.data.last7DaysRevenue as Array<Record<string, string | number>> | undefined) ?? []);
    return [];
  }, [data, deptKey]);

  const kpis = useMemo(() => {
    const values = data?.data ?? {};
    switch (deptKey) {
      case "vente":
        return [
          { title: "Clients", value: Number(values.clientsCount ?? 0), icon: Users, color: "blue" as const },
          { title: "Produits", value: Number(values.productsCount ?? 0), icon: Box, color: "green" as const },
          { title: "Ventes du jour", value: Number(values.salesToday ?? 0), icon: ShoppingCart, color: "orange" as const },
          { title: "CA mensuel", value: Number(values.salesThisMonth ?? 0), icon: Wallet, color: "purple" as const },
        ];
      case "finance":
        return [
          { title: "Revenus mois", value: Number(values.totalRevenueMonth ?? 0), icon: Wallet, color: "green" as const },
          { title: "Dépenses mois", value: Number(values.totalExpensesMonth ?? 0), icon: ShoppingCart, color: "red" as const },
          { title: "Marge nette", value: Number(values.netMargin ?? 0), icon: Activity, color: "blue" as const },
          { title: "Transactions", value: Number(values.transactionsCount ?? 0), icon: Box, color: "orange" as const },
        ];
      default:
        return [
          { title: "Indicateur 1", value: 0, icon: Users, color: "blue" as const },
          { title: "Indicateur 2", value: 0, icon: Box, color: "green" as const },
          { title: "Indicateur 3", value: 0, icon: ShoppingCart, color: "orange" as const },
          { title: "Indicateur 4", value: 0, icon: Wallet, color: "purple" as const },
        ];
    }
  }, [data, deptKey]);

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
  const recentActivity = (data?.data.recentActivity as { id: string; action_key: string; created_at: string }[] | undefined) ?? [];

  return (
    <DeptDashboardShell
      title={department.label}
      subtitle={department.description}
      icon={<Icon size={16} />}
      color={department.color}
      backHref={ROUTES.dept}
      backLabel="← Départements"
      isRefetching={isRefetching}
      onRefresh={() => void refetch()}
      lastUpdated={data?.lastUpdated ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, locale: fr }) : null}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <StatsCard key={kpi.title} title={kpi.title} value={kpi.value} icon={kpi.icon} color={kpi.color} />
        ))}
      </div>

      <DynamicDeptKpiChart deptKey={deptKey} data={chartData} />

      <section className="card p-5">
        <h2 className="section-title">Activité récente</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune activité récente.</p>
        ) : (
          <ul className="space-y-2">
            {recentActivity.slice(0, 5).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-700">{entry.action_key}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/activity-logs" className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
          Voir tout →
        </Link>
      </section>
    </DeptDashboardShell>
  );
}

