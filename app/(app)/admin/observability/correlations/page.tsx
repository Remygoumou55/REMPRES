import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listObservabilityCorrelationsRecent } from "@/modules/observability/server/repositories/observability-correlations-repository";

export default async function AdminObservabilityCorrelationsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listObservabilityCorrelationsRecent(supabase, 150);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Liens de corrélation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Attache des sources métier à un incident pour analyse causale.
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Incident</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Poids</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="max-w-[120px] truncate px-4 py-2 font-mono text-xs">{r.incident_id}</td>
                <td className="px-4 py-2">
                  <span className="font-mono text-xs">{r.source_kind}</span>{" "}
                  <span className="text-gray-600">{r.source_id}</span>
                </td>
                <td className="px-4 py-2 tabular-nums">{Number(r.weight)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Aucune corrélation.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
