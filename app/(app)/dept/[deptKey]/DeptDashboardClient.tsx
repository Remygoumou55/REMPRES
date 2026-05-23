"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  BarChart3,
  Box,
  RefreshCw,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/constants/departments";
import { ROUTES } from "@/lib/constants/routes";
import { useSectionDashboard } from "@/hooks/useSectionDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query/query-keys";
import type { DeptKpiApiResponse } from "@/lib/dept/kpi-contract";
import {
  ActivityFeed,
  DashboardBanner,
  EmptyChart,
  KpiCard,
  KpiGridSkeleton,
  type KpiCardColor,
} from "@/components/dashboard";
import { getGreeting } from "@/lib/utils/safe-query";
import { DepartmentOperationsStrip } from "@/modules/department-dashboards/components/DepartmentOperationsStrip";
import { HrVisualInsightsPanel } from "@/modules/department-dashboards/hr/components";

const DynamicDeptKpiChart = dynamic(() => import("./DeptKpiChart").then((m) => m.DeptKpiChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-card" />,
});

const STAT_TITLE_FR: Record<string, string> = {
  clients: "Clients",
  products: "Produits",
  salesToday: "Ventes du jour",
  salesThisMonth: "Ventes du mois",
  revenue: "Revenus du mois",
  expenses: "Dépenses du mois",
  margin: "Marge nette",
  transactions: "Transactions",
  activeTrainings: "Formations en cours",
  totalTrainees: "Apprenants",
  certificatesIssued: "Certificats délivrés",
  revenueThisMonth: "Revenus du mois",
  activeMissions: "Missions actives",
  completedMissions: "Missions terminées",
  totalClients: "Clients",
  totalItems: "Articles en stock",
  lowStockItems: "Stock faible",
  pendingOrders: "Commandes en attente",
};

const ICON_BY_STAT: Record<string, LucideIcon> = {
  clients: Users,
  products: Box,
  salesToday: ShoppingCart,
  salesThisMonth: Wallet,
  revenue: Wallet,
  expenses: ShoppingCart,
  margin: Activity,
  transactions: Box,
};

const COLOR_BY_STAT: Record<string, KpiCardColor> = {
  clients: "blue",
  products: "green",
  salesToday: "orange",
  salesThisMonth: "purple",
  revenue: "green",
  expenses: "red",
  margin: "blue",
  transactions: "orange",
};

const PLACEHOLDER_DEPTS = new Set<DepartmentKey>(["formation", "consultation", "marketing", "logistique"]);

type Props = {
  firstName: string;
};

export function DeptDashboardClient({ firstName }: Props) {
  const params = useParams<{ deptKey: string }>();
  const router = useRouter();
  const deptKey = String(params.deptKey ?? "").toLowerCase() as DepartmentKey;
  const department = DEPARTMENTS.find((item) => item.key === deptKey);

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!department) router.replace(ROUTES.dept);
  }, [department, router]);

  const { data, isLoading, isRefetching, refetch } = useSectionDashboard<DeptKpiApiResponse>(
    `/api/dept/${deptKey}/kpis`,
    [...queryKeys.dept.kpis(deptKey)],
    { staleTime: 30_000, refetchInterval: 60_000, enabled: Boolean(department) },
  );

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

  const isPlaceholder = Boolean(data?.data.metadata?.placeholder) || PLACEHOLDER_DEPTS.has(deptKey);
  const chart = (data?.data.charts ?? [])[0] ?? null;
  const chartEmpty = !chart?.points?.length;

  const kpiCards = useMemo(() => {
    const stats = data?.data.stats ?? [];
    return stats.slice(0, 4).map((stat) => ({
      title: STAT_TITLE_FR[stat.id] ?? stat.id,
      value: Number(stat.value ?? 0),
      icon: ICON_BY_STAT[stat.id] ?? Users,
      color: COLOR_BY_STAT[stat.id] ?? "blue",
      isEmpty: isPlaceholder && Number(stat.value ?? 0) === 0,
    }));
  }, [data?.data.stats, isPlaceholder]);

  if (!department) return null;

  const lastUpdated = data?.lastUpdated
    ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true, locale: fr })
    : null;

  return (
    <div className="page-wrapper space-y-6 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Link href={ROUTES.dept} className="text-sm font-medium text-primary hover:underline">
          ← Départements
        </Link>
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          <span>{lastUpdated ? `Mis à jour ${lastUpdated}` : "Mis à jour —"}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={14} className={isRefetching ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      <DashboardBanner
        greeting={greeting}
        firstName={firstName}
        date={frenchDate}
        time={clock}
        subtitle={department.label}
        platformOk
        priorityCount={0}
      />

      {isLoading ? (
        <KpiGridSkeleton count={4} />
      ) : (
        <Suspense fallback={<KpiGridSkeleton count={4} />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {kpiCards.map((kpi) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                color={kpi.color}
                isEmpty={kpi.isEmpty}
              />
            ))}
          </div>
        </Suspense>
      )}

      <DepartmentOperationsStrip deptKey={deptKey} />

      {deptKey === "rh" ? <HrVisualInsightsPanel payload={data?.data ?? null} /> : null}

      <section className="card p-4 sm:p-5">
        <p className="mb-2 text-sm font-semibold text-darktext">Évolution</p>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-card" />
        ) : chartEmpty ? (
          <EmptyChart message="Les données apparaîtront ici" icon={BarChart3} />
        ) : (
          <DynamicDeptKpiChart chart={chart} emptyMessage="Les données apparaîtront ici" />
        )}
      </section>

      <section className="card p-4 sm:p-5">
        <ActivityFeed
          items={data?.activities ?? []}
          viewAllHref="/admin/activity-logs"
        />
      </section>
    </div>
  );
}
