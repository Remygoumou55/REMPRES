import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAiForecastArtifactsRecent } from "@/modules/ai/server/repositories/ai-forecast-repository";

export default async function AdminAiForecastingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAiForecastArtifactsRecent(supabase, 50);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Artefacts forecasting</h1>
        <p className="mt-1 text-sm text-gray-600">
          Séries synthétiques append-only — méthode courante <span className="font-medium">heuristic_linear_local</span>
          .
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Série</th>
              <th className="px-4 py-3">Horizon (j)</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="max-w-[140px] truncate px-4 py-2 font-mono text-xs">{r.artifact_key}</td>
                <td className="px-4 py-2">{r.domain_key}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.series_key}</td>
                <td className="px-4 py-2 tabular-nums">{r.horizon_days}</td>
                <td className="px-4 py-2 text-xs">{r.method}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Aucun artefact.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
