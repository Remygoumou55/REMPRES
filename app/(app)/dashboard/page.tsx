import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getSuperAdminCockpitPayload } from "@/lib/server/super-admin-cockpit";
import { getLayoutAccess } from "@/lib/server/layout-access";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { resolvePostLoginRoute } from "@/lib/navigation/home-route";

const SuperAdminCockpitClient = dynamic(
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

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [access, kpis] = await Promise.all([getLayoutAccess(), getDashboardKpis()]);

  if (!access.isSuperAdmin) {
    redirect(resolvePostLoginRoute(access.roleKey, access.departmentKey));
  }

  const superAdminCockpit = await getSuperAdminCockpitPayload(user.id, { kpis });

  return (
    <SuperAdminCockpitClient userDisplayName={access.userDisplayName} payload={superAdminCockpit} />
  );
}
