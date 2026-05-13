import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listObservabilityPredictionsRecent } from "@/modules/observability/server/repositories/observability-predictions-repository";

export default async function AdminObservabilityPredictivePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listObservabilityPredictionsRecent(supabase, 50);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring prédictif</h1>
        <p className="mt-1 text-sm text-gray-600">
          Projections append-only (horizon en heures) — remplaceable par modèles externes sans changer le schéma
          append-only.
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Périmètre</th>
              <th className="px-4 py-3">Horizon (h)</th>
              <th className="px-4 py-3">Risque projeté</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.prediction_key}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.scope_key}</td>
                <td className="px-4 py-2 tabular-nums">{r.horizon_hours}</td>
                <td className="px-4 py-2 tabular-nums">{Number(r.projected_risk)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune prédiction stockée.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
