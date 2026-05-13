import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { CloudMonitoringToolbar } from "@/modules/cloud/components/dashboard/CloudMonitoringToolbar";
import { CloudOverviewMetrics } from "@/modules/cloud/components/dashboard/CloudOverviewMetrics";
import { getCloudOperationalOverview } from "@/modules/cloud/server/services/cloud-overview";

export default async function AdminCloudHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getCloudOperationalOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Plateforme cloud mondiale</h1>
        <p className="mt-1 text-sm text-gray-600">
          Catalogue régions, profils tenant/région, edge stubs, politiques de charge et checkpoints DR — reliés aux modules
          multi-tenant, observabilité, IA et écosystème sans refactor des moteurs existants.
        </p>
      </section>

      <CloudMonitoringToolbar />

      <CloudOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts natifs</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/multitenant" className="text-indigo-800 hover:underline">
              Multi-tenant & tenants
            </Link>
          </li>
          <li>
            <Link href="/admin/observability" className="text-indigo-800 hover:underline">
              Observabilité & risque
            </Link>
          </li>
          <li>
            <Link href="/admin/ai" className="text-indigo-800 hover:underline">
              IA / prédictif
            </Link>
          </li>
          <li>
            <Link href="/admin/ecosystem" className="text-indigo-800 hover:underline">
              Écosystème partenaires
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance" className="text-indigo-800 hover:underline">
              Conformité
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
