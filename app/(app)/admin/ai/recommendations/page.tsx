import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAiRecommendationsPending } from "@/modules/ai/server/repositories/ai-recommendations-repository";

export default async function AdminAiRecommendationsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAiRecommendationsPending(supabase, 120);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ai", label: "AI" },
          { href: "/admin/ai/recommendations", label: "Recommandations" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Recommandations</h1>
        <p className="mt-1 text-sm text-gray-600">
          Actions suggérées — statuts <span className="font-medium">applied</span> /{" "}
          <span className="font-medium">dismissed</span> gérés par les opérateurs AI.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Priorité</th>
              <th className="px-4 py-3">Titre</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Expire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{r.domain_key}</td>
                <td className="px-4 py-2 tabular-nums">{r.priority}</td>
                <td className="max-w-xs px-4 py-2 font-medium">{r.title}</td>
                <td className="max-w-md px-4 py-2 text-xs text-gray-700">{r.action_hint}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune recommandation en attente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
