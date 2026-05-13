import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { MultitenantMonitoringToolbar } from "@/modules/multitenant/components/dashboard/MultitenantMonitoringToolbar";
import { MultitenantOverviewMetrics } from "@/modules/multitenant/components/dashboard/MultitenantOverviewMetrics";
import { getMultitenantOperationalOverview } from "@/modules/multitenant/server/services/multitenant-overview";

export default async function AdminMultitenantHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getMultitenantOperationalOverview(supabase, user.id);

  return (
    <>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Multi-tenant & scaling SaaS</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registre tenants, adhésions utilisateurs, quotas / SLA, analytics et billing isolés par tenant — sans refactor des
          domaines métier ni duplication des moteurs existants.
        </p>
      </section>

      <MultitenantMonitoringToolbar />

      <MultitenantOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts natifs</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/ai" className="text-emerald-800 hover:underline">
              AI / prédictif
            </Link>
          </li>
          <li>
            <Link href="/admin/observability" className="text-emerald-800 hover:underline">
              Observabilité
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance" className="text-emerald-800 hover:underline">
              Conformité
            </Link>
          </li>
          <li>
            <Link href="/admin/global-dashboard" className="text-emerald-800 hover:underline">
              Tableau de bord global
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
