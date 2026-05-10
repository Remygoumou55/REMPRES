import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { EcosystemMonitoringToolbar } from "@/modules/ecosystem/components/dashboard/EcosystemMonitoringToolbar";
import { EcosystemOverviewMetrics } from "@/modules/ecosystem/components/dashboard/EcosystemOverviewMetrics";
import { getEcosystemOperationalOverview } from "@/modules/ecosystem/server/services/ecosystem-overview";

export default async function AdminEcosystemHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getEcosystemOperationalOverview(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ecosystem", label: "Écosystème partenaires" },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Écosystème global & fédération</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registre partenaires, liens tenants, certifications, SLA, routes connecteurs et journal fédération — relié au
          marketplace, au multi-tenant et aux jobs infra existants.
        </p>
      </section>

      <EcosystemMonitoringToolbar />

      <EcosystemOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/platform" className="text-amber-800 hover:underline">
              Plateforme / marketplace
            </Link>
          </li>
          <li>
            <Link href="/admin/multitenant" className="text-amber-800 hover:underline">
              Multi-tenant
            </Link>
          </li>
          <li>
            <Link href="/admin/ai" className="text-amber-800 hover:underline">
              AI
            </Link>
          </li>
          <li>
            <Link href="/admin/observability" className="text-amber-800 hover:underline">
              Observabilité
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
