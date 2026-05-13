import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAutomationWorkflowRuns } from "@/modules/automation/server/repositories/automation-runs-repository";

export default async function AdminAutomationRunsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAutomationWorkflowRuns(supabase, 150);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Exécutions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Suivi des instances ; les SLA sont calculés à l&apos;insertion selon les politiques actives.
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Étape</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Escalade</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{r.workflow_key}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2 tabular-nums">{r.current_step}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {r.sla_deadline_at ? new Date(r.sla_deadline_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-2 text-xs">{r.escalated_at ? "oui" : "non"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Aucune exécution visible avec votre profil.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
