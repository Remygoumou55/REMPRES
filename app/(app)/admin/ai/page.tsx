import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { AiMonitoringToolbar } from "@/modules/ai/components/dashboard/AiMonitoringToolbar";
import { AiOverviewMetrics } from "@/modules/ai/components/dashboard/AiOverviewMetrics";
import { getAiOperationalOverview } from "@/modules/ai/server/services/ai-overview";

export default async function AdminAiHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getAiOperationalOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">AI / prédictif opérationnel</h1>
        <p className="mt-1 text-sm text-gray-600">
          Insights, recommandations et séries prévisionnelles branchés sur l&apos;observabilité existante — pipelines
          heuristiques extensibles sans refactor du socle analytics.
        </p>
      </section>

      <AiMonitoringToolbar />

      <AiOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Liens</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/observability" className="text-violet-800 hover:underline">
              Observabilité
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance" className="text-violet-800 hover:underline">
              Conformité
            </Link>
          </li>
          <li>
            <Link href="/admin/automation" className="text-violet-800 hover:underline">
              Automation
            </Link>
          </li>
          <li>
            <Link href="/admin/intelligence" className="text-violet-800 hover:underline">
              Intelligence entreprise
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
