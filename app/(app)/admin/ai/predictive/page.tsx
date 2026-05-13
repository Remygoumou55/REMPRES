import Link from "next/link";
import { TableShell } from "@/components/ui/table-shell";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAiPipelineRunsRecent } from "@/modules/ai/server/repositories/ai-pipeline-runs-repository";

export default async function AdminAiPredictivePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAiPipelineRunsRecent(supabase, 60);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Prédictif & pipelines</h1>
        <p className="mt-1 text-sm text-gray-600">
          Historique des exécutions <span className="font-medium">ai.insight_pipeline</span>.
        </p>
        <Link href="/admin/ai/forecasting" className="mt-3 inline-flex text-sm font-medium text-violet-800 hover:underline">
          Artefacts forecasting →
        </Link>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Pipeline</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Erreur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.pipeline_key}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs">{new Date(r.started_at).toLocaleString()}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs">{new Date(r.finished_at).toLocaleString()}</td>
                <td className="max-w-xs truncate px-4 py-2 text-xs text-red-700">{r.error_message ?? "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucun run enregistré.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
