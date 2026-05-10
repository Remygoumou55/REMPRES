import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAutomationSchedules } from "@/modules/automation/server/repositories/automation-schedules-repository";

export default async function AdminAutomationSchedulesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAutomationSchedules(supabase, 100);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/automation", label: "Automation" },
          { href: "/admin/automation/schedules", label: "Planifications" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Planifications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les déclencheurs utilisent <span className="font-medium">next_run_at</span> ; le worker schedule sweep crée
          une exécution puis enfile un tick. Intervalle optionnel dans le payload template :{" "}
          <code className="rounded bg-gray-100 px-1">interval_minutes</code>.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3">Prochain run</th>
              <th className="px-4 py-3">Dernier run</th>
              <th className="px-4 py-3">Timezone</th>
              <th className="px-4 py-3">Cron</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{r.workflow_key}</td>
                <td className="px-4 py-2">{r.is_active ? "oui" : "non"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs">
                  {new Date(r.next_run_at).toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2">{r.timezone}</td>
                <td className="max-w-xs truncate px-4 py-2 font-mono text-xs">{r.cron_expression ?? "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Aucune planification.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
