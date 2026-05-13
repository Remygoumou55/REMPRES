import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAutomationWorkflowDefinitions } from "@/modules/automation/server/repositories/automation-definitions-repository";

export default async function AdminAutomationWorkflowsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAutomationWorkflowDefinitions(supabase, 200);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Workflows</h1>
        <p className="mt-1 text-sm text-gray-600">Définitions versionnées branchées sur les domaines ERP.</p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Libellé</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.workflow_key} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{r.workflow_key}</td>
                <td className="px-4 py-2">{r.domain_key}</td>
                <td className="px-4 py-2">{r.label}</td>
                <td className="px-4 py-2 tabular-nums">{r.version}</td>
                <td className="px-4 py-2">{r.is_active ? "oui" : "non"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune définition.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
