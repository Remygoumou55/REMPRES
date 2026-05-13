import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listPartnersForUi } from "@/modules/ecosystem/server/repositories/partners-repository";
import { TableShell } from "@/components/ui/table-shell";

export default async function AdminEcosystemPartnersPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listPartnersForUi(supabase);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Registre partenaires</h1>
        <p className="mt-1 text-sm text-gray-600">Table native — sans duplication du catalogue marketplace plugins.</p>

        <TableShell className="mt-4">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-medium">Clé</th>
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Tier</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                <th className="py-2 font-medium">Région</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-800">{r.partner_key}</td>
                  <td className="py-2 pr-4 text-gray-900">{r.display_name}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.tier}</td>
                  <td className="py-2 pr-4 text-gray-700">{r.status}</td>
                  <td className="py-2 text-gray-700">{r.headquarters_region}</td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Aucun partenaire — appliquer la migration 057.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableShell>

        <Link href="/admin/ecosystem/certifications" className="mt-4 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Certifications →
        </Link>
      </section>
    </>
  );
}
