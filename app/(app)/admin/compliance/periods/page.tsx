import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listComplianceAccountingPeriods } from "@/modules/compliance/server/repositories/compliance-periods-repository";

export default async function AdminCompliancePeriodsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listComplianceAccountingPeriods(supabase, 150);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Périodes comptables</h1>
        <p className="mt-1 text-sm text-gray-600">
          États <span className="font-medium">locked/archived</span> sont immuables (bornes et rouverture interdites).
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Entité</th>
              <th className="px-4 py-3">Période</th>
              <th className="px-4 py-3">Exercice</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.legal_entity_key}</td>
                <td className="whitespace-nowrap px-4 py-2">
                  {r.period_start} → {r.period_end}
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {r.fiscal_year}
                  {r.fiscal_month != null ? ` / M${r.fiscal_month}` : ""}
                </td>
                <td className="px-4 py-2">{r.status}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Aucune période — aucun blocage par calendrier (comportement initial compatible).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
