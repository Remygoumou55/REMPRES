import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listComplianceSodRules } from "@/modules/compliance/server/repositories/compliance-sod-repository";

export default async function AdminComplianceSodPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listComplianceSodRules(supabase, 100);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/compliance", label: "Conformité" },
          { href: "/admin/compliance/sod", label: "SoD" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Séparation des fonctions (SoD)</h1>
        <p className="mt-1 text-sm text-gray-600">
          Politiques déclaratives ; enforcement <span className="font-medium">blocking</span> branché progressivement
          sur les workflows sans doublon moteur.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Règle</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.rule_key}</td>
                <td className="px-4 py-2">{r.scope_module}</td>
                <td className="px-4 py-2">{r.enforcement}</td>
                <td className="px-4 py-2">{r.is_active ? "oui" : "non"}</td>
                <td className="max-w-lg px-4 py-2 text-xs text-gray-700">{r.description}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune règle SoD.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
