import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listComplianceRetentionPolicies } from "@/modules/compliance/server/repositories/compliance-retention-repository";

export default async function AdminComplianceRetentionPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listComplianceRetentionPolicies(supabase, 80);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Politiques de rétention</h1>
        <p className="mt-1 text-sm text-gray-600">Référentiel légal interne par domaine métier (jours).</p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Rétention (j)</th>
              <th className="px-4 py-3">Base légale</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3">Portée types</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{r.domain_key}</td>
                <td className="px-4 py-2 tabular-nums">{r.retention_days}</td>
                <td className="max-w-md px-4 py-2 text-xs text-gray-700">{r.legal_basis}</td>
                <td className="px-4 py-2">{r.is_active ? "oui" : "non"}</td>
                <td className="max-w-xs truncate px-4 py-2 font-mono text-xs">
                  {(r.applies_to_entity_types ?? []).join(", ") || "—"}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune politique.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
