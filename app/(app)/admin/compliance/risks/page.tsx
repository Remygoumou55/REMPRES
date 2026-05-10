import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listComplianceRiskSignalsOpen } from "@/modules/compliance/server/repositories/compliance-risks-repository";

export default async function AdminComplianceRisksPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listComplianceRiskSignalsOpen(supabase, 150);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/compliance", label: "Conformité" },
          { href: "/admin/compliance/risks", label: "Risques" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Signaux de risque</h1>
        <p className="mt-1 text-sm text-gray-600">
          Détection automatisée (ex. brouillon journal sur période close ou exercice verrouillé).
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Règle</th>
              <th className="px-4 py-3">Gravité</th>
              <th className="px-4 py-3">Entité</th>
              <th className="px-4 py-3">Détecté</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.rule_key}</td>
                <td className="px-4 py-2">{r.severity}</td>
                <td className="max-w-xs truncate px-4 py-2 text-xs">
                  {r.entity_type ?? "—"} {r.entity_id ? r.entity_id.slice(0, 12) : ""}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.detected_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Aucun signal ouvert.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
