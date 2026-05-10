import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAutomationEventsRecent } from "@/modules/automation/server/repositories/automation-events-repository";

export default async function AdminAutomationEventsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAutomationEventsRecent(supabase, 200);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/automation", label: "Automation" },
          { href: "/admin/automation/events", label: "Événements" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Bus événements</h1>
        <p className="mt-1 text-sm text-gray-600">
          Journal append-only des événements automation et des traces d&apos;étapes métier.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Agrégat</th>
              <th className="px-4 py-3">Corrélation</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">{r.event_key}</td>
                <td className="px-4 py-2">{r.domain_key}</td>
                <td className="max-w-[180px] truncate px-4 py-2 text-xs">
                  {r.aggregate_type ?? "—"} {r.aggregate_id ? `/ ${r.aggregate_id.slice(0, 8)}…` : ""}
                </td>
                <td className="max-w-[140px] truncate px-4 py-2 font-mono text-xs">{r.correlation_id ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucun événement.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
