import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { AutomationOverviewMetrics } from "@/modules/automation/components/dashboard/AutomationOverviewMetrics";
import { getAutomationOperationalOverview } from "@/modules/automation/server/services/automation-overview";

export default async function AdminAutomationAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getAutomationOperationalOverview(supabase);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Analytics automation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Indicateurs opérationnels rapides ; pour la vue consolidée gouvernance, utilisez aussi le centre
          d&apos;intelligence.
        </p>
        <Link href="/admin/intelligence" className="mt-3 inline-flex text-sm font-medium text-indigo-700 hover:underline">
          Intelligence entreprise →
        </Link>
      </section>

      <AutomationOverviewMetrics overview={overview} />
    </>
  );
}
