import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { AutomationOverviewMetrics } from "@/modules/automation/components/dashboard/AutomationOverviewMetrics";
import { AutomationSweepToolbar } from "@/modules/automation/components/dashboard/AutomationSweepToolbar";
import { getAutomationOperationalOverview } from "@/modules/automation/server/services/automation-overview";

export default async function AdminAutomationHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getAutomationOperationalOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Automation entreprise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Orchestration des workflows métier, files infrastructure et événements cross-domaines. Les étapes
          s&apos;exécutent par ticks atomiques (<code className="rounded bg-gray-100 px-1">automation.workflow_run_tick</code>
          ).
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Exécutions visibles selon la politique RLS : vos propres runs ou vue complète pour les opérateurs{" "}
          <strong className="font-normal text-gray-600">Administration</strong> / console admin.
        </p>
      </section>

      <AutomationSweepToolbar />

      <AutomationOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Raccourcis</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/automation/workflows" className="text-indigo-700 hover:underline">
              Définitions et versions de workflows
            </Link>
          </li>
          <li>
            <Link href="/admin/automation/runs" className="text-indigo-700 hover:underline">
              Suivi des exécutions et SLA
            </Link>
          </li>
          <li>
            <Link href="/admin/automation/events" className="text-indigo-700 hover:underline">
              Bus d&apos;événements automation
            </Link>
          </li>
          <li>
            <Link href="/admin/automation/governance" className="text-indigo-700 hover:underline">
              Gouvernance et escalades
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
