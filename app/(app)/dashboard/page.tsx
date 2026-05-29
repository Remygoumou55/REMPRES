import nextDynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { loadAccueilDashboard } from "@/lib/server/dashboard/load-accueil-metrics";
import { getSuperAdminCockpitPayload } from "@/lib/server/super-admin-cockpit";
import { getLayoutAccess } from "@/lib/server/layout-access";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { resolvePostLoginRoute } from "@/lib/navigation/home-route";
import { Suspense } from "react";
import { KpiGridSkeleton } from "@/components/dashboard/kpi-grid-skeleton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SuperAdminCockpitClient = nextDynamic(
  () =>
    import("@/components/dashboard/super-admin-cockpit/SuperAdminCockpitClient").then(
      (m) => m.SuperAdminCockpitClient,
    ),
  {
    loading: () => (
      <div className="page-wrapper space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ),
    ssr: true,
  },
);

export const metadata = {
  title: `${NAV_LABELS.home} — RemPres ERP`,
};

const DEPT_REDIRECT: Record<string, string> = {
  responsable_vente: "/dept/vente",
  comptable: "/dept/finance",
  responsable_rh: "/dept/rh",
  responsable_formation: "/dept/formation",
  responsable_consultation: "/dept/consultation",
  responsable_marketing: "/dept/marketing",
  responsable_logistique: "/dept/logistique",
};

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const access = await getLayoutAccess();
  const roleKey = (access.roleKey ?? "").trim().toLowerCase();
  const deptPath = DEPT_REDIRECT[roleKey];
  if (deptPath) {
    redirect(deptPath);
  }

  const [kpis, accueil] = await Promise.all([
    getDashboardKpis(),
    loadAccueilDashboard(user.id, user.email ?? undefined),
  ]);

  if (!access.isSuperAdmin) {
    const target = resolvePostLoginRoute(access.roleKey, access.departmentKey);
    redirect(target === "/dashboard" ? "/actions" : target);
  }

  const superAdminCockpit = await getSuperAdminCockpitPayload(user.id, { kpis, accueil });

  return (
    <Suspense fallback={<KpiGridSkeleton />}>
      <SuperAdminCockpitClient payload={superAdminCockpit} />
    </Suspense>
  );
}
