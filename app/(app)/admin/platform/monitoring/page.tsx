import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { PlatformMonitoringToolbar } from "@/modules/platform/components/dashboard/PlatformMonitoringToolbar";

export default async function AdminPlatformMonitoringPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring plateforme</h1>
        <p className="mt-1 text-sm text-gray-600">
          Jobs sur la file <code className="rounded bg-gray-100 px-1">platform</code> ; même worker infra que les autres domaines.
        </p>
      </section>

      <PlatformMonitoringToolbar />

      <Link href="/admin/global-dashboard" className="inline-flex text-sm font-medium text-cyan-800 hover:underline">
        Tableau global →
      </Link>
    </>
  );
}
