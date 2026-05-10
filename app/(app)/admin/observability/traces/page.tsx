import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listObservabilityTraceEventsRecent } from "@/modules/observability/server/repositories/observability-traces-repository";

export default async function AdminObservabilityTracesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listObservabilityTraceEventsRecent(supabase, 150);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/observability", label: "Observabilité" },
          { href: "/admin/observability/traces", label: "Traces" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Trace events</h1>
        <p className="mt-1 text-sm text-gray-600">
          Journal append-only par <span className="font-medium">trace_id</span> — tracing léger ERP.
        </p>
      </section>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Trace</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Opération</th>
              <th className="px-4 py-3">Durée ms</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="max-w-[120px] truncate px-4 py-2 font-mono text-xs">{r.trace_id}</td>
                <td className="px-4 py-2">{r.domain_key}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.operation_key}</td>
                <td className="px-4 py-2 tabular-nums">{r.duration_ms ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Aucune trace.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
