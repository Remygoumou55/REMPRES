import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { PlatformMonitoringToolbar } from "@/modules/platform/components/dashboard/PlatformMonitoringToolbar";
import { PlatformOverviewMetrics } from "@/modules/platform/components/dashboard/PlatformOverviewMetrics";
import { getPlatformOperationalOverview } from "@/modules/platform/server/services/platform-overview";

export default async function AdminPlatformHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getPlatformOperationalOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Extensibilité ERP / marketplace</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registre plugins, installations tenant-scoped, connexions partenaires et outbox événements — relié au
          multi-tenant, automation et observabilité existants sans moteur parallèle.
        </p>
      </section>

      <PlatformMonitoringToolbar />

      <PlatformOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/multitenant" className="text-cyan-800 hover:underline">
              Multi-tenant
            </Link>
          </li>
          <li>
            <Link href="/admin/automation" className="text-cyan-800 hover:underline">
              Automation
            </Link>
          </li>
          <li>
            <Link href="/admin/ai" className="text-cyan-800 hover:underline">
              AI / prédictif
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance" className="text-cyan-800 hover:underline">
              Conformité
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
